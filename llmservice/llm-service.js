// Importaciones
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

// Configuración inicial de Express y CORS
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000", // Origen permitido
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Métodos permitidos
    credentials: true, // Permitir credenciales
  })
);

// Cargar variables de entorno
require("dotenv").config();

// Puerto y variables globales
const port = process.env.PORT || 8003; // Puerto del servidor
let moderation = "You are a quiz game assistant."; // Prompt base para el LLM
const WIKIDATA_SERVICE_URL =
  process.env.WIKIDATA_SERVICE_URL || "http://wikidataservice:8020/api"; // URL servicio Wikidata

// Middlewares de Express
app.use(express.json({ limit: "10mb" })); // Parsear JSON con límite de tamaño

// Middleware para inyectar API Key desde entorno si no viene en request
app.use((req, res, next) => {
  if (!req.body.apiKey && process.env.LLM_API_KEY) {
    req.body.apiKey = process.env.LLM_API_KEY;
  }
  next();
});

// Inicializar cliente global de GoogleGenAI
let genAI = null;
if (process.env.LLM_API_KEY) {
  try {
    genAI = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
    console.log("GoogleGenAI client initialized successfully.");
  } catch (initError) {
    console.error(
      "FATAL ERROR: Could not initialize GoogleGenAI with environment API Key:",
      initError.message
    );
    genAI = null;
  }
} else {
  console.error("FATAL ERROR: LLM_API_KEY is not defined in the environment.");
}

// Configuración para diferentes proveedores de LLM
const llmConfigs = {
  gemini: {
    url: () =>
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.LLM_API_KEY}`,
    transformRequest: (question, moderation) => ({
      contents: [{ parts: [{ text: `${moderation}\n${question}` }] }],
    }),
    transformResponse: (response) =>
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
    }),
  },
  empathy: {
    url: () => "https://empathyai.prod.empathy.co/v1/chat/completions",
    transformRequest: (question, moderation) => ({
      model: "qwen/Qwen2.5-Coder-7B-Instruct",
      stream: false,
      messages: [
        { role: "system", content: moderation },
        { role: "user", content: question },
      ],
    }),
    transformResponse: (response) =>
      response.data.choices?.[0]?.message?.content || "No response",
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
  },
};

// --- Funciones Helper ---

// Función para validar campos requeridos
function validateRequiredFields(req, requiredFields) {
  for (const field of requiredFields) {
    if (
      !(field in req.body) ||
      req.body[field] === undefined ||
      req.body[field] === null
    ) {
      // Permitir 0 y false como valores válidos
      if (req.body[field] !== 0 && req.body[field] !== false) {
        throw new Error(`Missing or invalid required field: ${field}`);
      }
    }
    // Validar que arrays requeridos no estén vacíos
    if (
      Array.isArray(req.body[field]) &&
      req.body[field].length === 0 &&
      (field === "questions" || field === "answers") // Aplicar solo a estos campos u otros si es necesario
    ) {
      throw new Error(`Required array field '${field}' cannot be empty.`);
    }
  }
}

// Función para generar una imagen usando el modelo de Gemini
async function sendImageRequestToGemini(prompt, apiKey) {
  let client = genAI;
  if (apiKey) {
    try {
      client = new GoogleGenAI({ apiKey });
      console.log(
        "[sendImageRequestToGemini] Using temporary client with provided apiKey."
      );
    } catch (tempClientError) {
      console.error(
        "[sendImageRequestToGemini] Error creating temporary client:",
        tempClientError.message
      );
      if (!genAI)
        throw new Error(
          "Failed to create API client and global is unavailable."
        );
      console.warn(
        "[sendImageRequestToGemini] Using global client as fallback."
      );
      client = genAI; // Fallback al cliente global
    }
  }
  if (!client)
    throw new Error("API Key for image generation is missing or invalid.");

  try {
    const modelName = "gemini-2.0-flash-exp-image-generation"; // Revisa si este modelo sigue disponible o usa uno actual
    console.log(
      `[sendImageRequestToGemini] Using model: ${modelName}. Prompt: "${prompt.substring(
        0,
        50
      )}..."`
    );

    const imageGenPrompt = `Visually represent the main concept of the following idea in an image, without including any text. Focus on the core concept and create an image that captures its essence. Do not include any letters or words in the image. Use an animated movie style. Return the image as a base64-encoded string. The Idea to represent: ${prompt}`;

    const response = await client.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: imageGenPrompt }] }],
      config: {
        responseModalities: ["Text", "Image"],
      },
    });

    const candidates = response?.candidates;
    if (!candidates || candidates.length === 0)
      throw new Error("No candidates returned from Gemini.");
    const parts = candidates[0]?.content?.parts;
    if (!parts)
      throw new Error(
        "No content parts found in the Gemini response candidate."
      );
    const imagePart = parts.find(
      (p) => p.inlineData?.mimeType?.startsWith("image/") && p.inlineData.data
    );
    if (!imagePart) {
      console.error(
        "[sendImageRequestToGemini] No valid image part found in response. Parts:",
        parts
      );
      throw new Error(
        "No image data returned from Gemini in the expected format."
      );
    }

    const base64Image = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    console.log(
      `[sendImageRequestToGemini] Success for prompt "${prompt.substring(
        0,
        50
      )}...".`
    );
    return base64Image;
  } catch (error) {
    console.error(
      `[sendImageRequestToGemini] Error generating image for prompt "${prompt.substring(
        0,
        50
      )}...":`,
      error.message
    );
    throw error; // Re-lanzar para que el endpoint lo maneje
  }
}

// Función genérica para enviar preguntas al LLM
async function sendQuestionToLLM(question, apiKey, moderation) {
  try {
    const modelProvider = process.env.LLM_PROVIDER || "gemini"; // Default a gemini
    const config = llmConfigs[modelProvider];
    if (!config)
      throw new Error(`Model provider '${modelProvider}' is not supported.`);

    const effectiveApiKey = apiKey || process.env.LLM_API_KEY;
    if (!effectiveApiKey && modelProvider !== "empathy") {
      // Empathy podría no necesitar key aquí
      console.error(
        `[sendQuestionToLLM] API Key missing for provider ${modelProvider}`
      );
      throw new Error(
        `API Key is required for LLM provider '${modelProvider}'.`
      );
    }

    const url = config.url();
    const requestData = config.transformRequest(question, moderation);
    const headers = config.headers(effectiveApiKey);

    console.log(`[sendQuestionToLLM] Sending request to ${modelProvider}...`);
    const response = await axios.post(url, requestData, { headers });
    console.log(`[sendQuestionToLLM] Received response from ${modelProvider}.`);
    return config.transformResponse(response);
  } catch (error) {
    // Log más detallado del error de Axios
    const errorDetails = error.response
      ? `Status: ${error.response.status}, Data: ${JSON.stringify(
          error.response.data
        )}`
      : error.message;
    console.error(
      `Error sending question to ${process.env.LLM_PROVIDER || "gemini"}:`,
      errorDetails
    );
    // Devolver un error identificable
    return `LLM_ERROR: Failed to process request - ${error.message}`;
  }
}

// Función para limpiar y parsear respuestas JSON del LLM
function parseJsonResponse(jsonString) {
  if (typeof jsonString !== "string") {
    // Si ya es un objeto, devolverlo (puede pasar si transformResponse ya parsea)
    if (typeof jsonString === "object" && jsonString !== null)
      return jsonString;
    throw new Error("Invalid input: Expected a JSON string.");
  }
  try {
    // Intento 1: Parsear directamente
    return JSON.parse(jsonString);
  } catch (e1) {
    try {
      // Intento 2: Limpiar markdown y extraer JSON principal
      const cleanedJson = jsonString
        .replace(/^```json\s*/, "") // Quitar ```json al inicio
        .replace(/\s*```$/, "") // Quitar ``` al final
        .trim();
      // Buscar el primer '{' y el último '}' para extraer el objeto principal
      const firstBrace = cleanedJson.indexOf("{");
      const lastBrace = cleanedJson.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const potentialJson = cleanedJson.substring(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(potentialJson);
        } catch (e_extract) {
          /* Ignorar error de extracción, probar el siguiente */
        }
      }
      // Intento 3: Parsear el string limpiado directamente (si la extracción falló)
      return JSON.parse(cleanedJson);
    } catch (e2) {
      // Si todos los intentos fallan, loguear y lanzar error
      console.error(
        "[parseJsonResponse] All JSON parsing attempts failed.",
        e1.message,
        e2.message
      );
      console.error(
        "[parseJsonResponse] Original string causing error:",
        jsonString.substring(0, 500) + "..."
      ); // Loguear parte del string problemático
      throw new Error(
        "Could not parse LLM response as JSON after multiple attempts."
      );
    }
  }
}

// --- Funciones Wikidata ---
async function getWikidataForCategory(category, count = 1) {
  try {
    // console.log(`[getWikidataForCategory] Getting ${count} entries for category: ${category}`);
    const response = await axios.get(
      `${WIKIDATA_SERVICE_URL}/entries/${category}?count=${count}`
    );
    // Devolver el primer elemento si count es 1 y hay resultados
    return count === 1 &&
      Array.isArray(response.data) &&
      response.data.length > 0
      ? response.data[0]
      : response.data;
  } catch (error) {
    console.error(
      `[getWikidataForCategory] Error getting Wikidata for ${category}:`,
      error.response?.status || error.message
    );
    return null; // Devolver null en caso de error
  }
}
async function getWikidataRandomEntry() {
  try {
    const response = await axios.get(`${WIKIDATA_SERVICE_URL}/entries/random`);
    return response.data;
  } catch (error) {
    console.error(
      "[getWikidataRandomEntry] Error getting random entry:",
      error.response?.status || error.message
    );
    return null;
  }
}
async function getMultipleRandomEntries(questionsCount = 10) {
  // console.log(`[getMultipleRandomEntries] Attempting to get ${questionsCount} random entries...`);
  // Generar promesas para obtener entradas aleatorias
  const entriesPromises = Array.from({ length: questionsCount }, () =>
    getWikidataRandomEntry()
  );
  const results = await Promise.allSettled(entriesPromises); // Esperar a que todas terminen
  // Filtrar y mapear solo las exitosas con valor válido
  const validEntries = results
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => ({ data: result.value })); // Envolver en { data: ... } para consistencia
  console.log(
    `[getMultipleRandomEntries] Successfully obtained ${validEntries.length} random entries.`
  );
  return validEntries;
}
function formatEntryInfo(entry) {
  if (!entry?.data) return "";
  const { category, ...data } = entry.data;
  let info = "";
  // Formatear basado en categoría
  switch (category) {
    case "paises":
      info = `País: ${data.countryLabel || "?"}, Capital: ${
        data.capitalLabel || "?"
      }`;
      break;
    case "monumentos":
      info = `Monumento: ${data.monumentLabel || "?"}, País: ${
        data.countryLabel || "?"
      }`;
      break;
    case "elementos":
      info = `Elemento: ${data.elementLabel || "?"}, Símbolo: ${
        data.symbol || "?"
      }`;
      break;
    case "peliculas":
      info = `Película: ${data.peliculaLabel || "?"}, Director: ${
        data.directorLabel || "?"
      }`;
      break;
    case "canciones":
      info = `Canción: ${data.songLabel || "?"}, Artista: ${
        data.artistLabel || "?"
      }`;
      break;
    case "formula1":
      info = `Campeonato F1 Año: ${data.year || "?"}, Ganador: ${
        data.winnerLabel || "?"
      }`;
      break;
    case "pinturas":
      info = `Pintura: ${data.paintingLabel || "?"}, Autor: ${
        data.artistLabel || "?"
      }`;
      break;
    default:
      info = `Concepto: ${data.label || "Desconocido"}`;
  }
  // Limpiar campos desconocidos
  return info.replace(/, [^:]+: \?/g, "").replace(/[^:]+: \?, /g, "");
}

// --- Función de Generación de Pregunta con Retries y Logging Mejorado ---
async function generateQuestionForEntry(entry, apiKey, maxAttempts = 3) {
  const entryInfo = formatEntryInfo(entry);
  if (!entryInfo) {
    console.error(
      "[generateQuestionForEntry] Could not format info for entry:",
      entry
    );
    return null;
  }
  const entryCategory = entry?.data?.category || "variado";
  // console.log(`[generateQuestionForEntry] Preparing to generate question for category ${entryCategory}`);

  // Prompt Reforzado con ejemplo
  const prompt = `A partir del siguiente texto: "${entryInfo}", genera 1 pregunta de opción múltiple para un juego de quiz.
La pregunta debe tener EXACTAMENTE 4 opciones de respuesta en un array llamado "answers".
EXACTAMENTE UNA de las opciones debe ser la correcta, marcada con "isCorrect": true.
Las otras TRES opciones deben ser incorrectas ("isCorrect": false) pero plausibles y relacionadas con el tema.
NO incluyas la respuesta correcta directamente en el texto de la pregunta si es el sujeto principal (ej. no "¿Quién dirigió X?" si la info es "Película: X, Director: Y"). Pregunta por una característica.
Si la info es sobre capital (ej. "País: España, Capital: Madrid"), pregunta "¿Cuál es la capital de España?".
Si la info es sobre símbolo químico (ej. "Elemento: Oro, Símbolo: Au"), pregunta "¿Cuál es el símbolo químico del Oro?".

Información Base: "${entryInfo}"

Formato de Respuesta ESTRICTAMENTE OBLIGATORIO (SOLO el objeto JSON, sin texto adicional antes o después, sin markdown \`\`\`, usando comillas dobles válidas):
{
  "question": "Texto de la pregunta aquí",
  "answers": [
    { "text": "Texto respuesta correcta", "isCorrect": true },
    { "text": "Texto respuesta incorrecta 1", "isCorrect": false },
    { "text": "Texto respuesta incorrecta 2", "isCorrect": false },
    { "text": "Texto respuesta incorrecta 3", "isCorrect": false }
  ]
}
EJEMPLO de salida válida para "Elemento: Oro, Símbolo: Au":
{
  "question": "¿Cuál es el símbolo químico del Oro?",
  "answers": [
    { "text": "Au", "isCorrect": true },
    { "text": "Ag", "isCorrect": false },
    { "text": "Or", "isCorrect": false },
    { "text": "Go", "isCorrect": false }
  ]
}
Asegúrate de seguir este formato JSON EXACTAMENTE.`;

  // Bucle de reintentos
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(
      `[generateQuestionForEntry] Attempt ${attempt}/${maxAttempts} for entry: ${entryCategory} - "${entryInfo.substring(
        0,
        40
      )}..."`
    );
    try {
      const llmResponse = await sendQuestionToLLM(prompt, apiKey, moderation);

      // 1. Validar respuesta básica del LLM
      if (
        typeof llmResponse === "string" &&
        llmResponse.startsWith("LLM_ERROR:")
      ) {
        console.error(
          `[Attempt ${attempt}] Error from sendQuestionToLLM:`,
          llmResponse
        );
        if (attempt === maxAttempts)
          throw new Error(
            `LLM Error after ${maxAttempts} attempts: ${llmResponse}`
          );
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500)
        ); // Pausa con jitter
        continue;
      }
      if (
        typeof llmResponse !== "string" ||
        !llmResponse.trim().startsWith("{")
      ) {
        console.error(
          `[Attempt ${attempt}] Invalid response type or not JSON object from LLM:`,
          llmResponse.substring(0, 200)
        );
        if (attempt === maxAttempts)
          throw new Error(
            `Invalid LLM response type after ${maxAttempts} attempts.`
          );
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500)
        );
        continue;
      }

      // 2. Intentar parsear JSON
      let parsedResponse;
      try {
        parsedResponse = parseJsonResponse(llmResponse);
      } catch (parseError) {
        console.error(
          `[Attempt ${attempt}] Error parsing LLM response:`,
          parseError.message
        );
        console.error(
          `[Attempt ${attempt}] Raw LLM response causing parse error: <<<${llmResponse}>>>`
        ); // Log respuesta cruda
        if (attempt === maxAttempts)
          throw new Error(
            `Failed to parse LLM response after ${maxAttempts} attempts.`
          );
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500)
        );
        continue;
      }

      // 3. Validar estructura y contenido del JSON parseado
      const correctAnswers = parsedResponse.answers?.filter(
        (a) => a?.isCorrect === true
      );
      const isValid =
        parsedResponse &&
        typeof parsedResponse.question === "string" &&
        parsedResponse.question.trim().length > 0 && // Pregunta no vacía
        Array.isArray(parsedResponse.answers) &&
        parsedResponse.answers.length === 4 && // Exactamente 4 respuestas
        parsedResponse.answers.every(
          // Todas las respuestas tienen texto no vacío y bool isCorrect
          (a) =>
            a &&
            typeof a.text === "string" &&
            a.text.trim().length > 0 &&
            typeof a.isCorrect === "boolean"
        ) &&
        correctAnswers?.length === 1; // Exactamente 1 respuesta correcta

      if (!isValid) {
        console.error(
          `[Attempt ${attempt}] Validation failed for parsed response.`
        );
        console.error(
          `[Attempt ${attempt}] Parsed response causing validation error:`,
          JSON.stringify(parsedResponse, null, 2)
        ); // Log respuesta parseada
        if (!parsedResponse.answers || parsedResponse.answers.length !== 4)
          console.error(
            "Validation Error Detail: Incorrect number of answers."
          );
        if (correctAnswers?.length !== 1)
          console.error(
            `Validation Error Detail: Found ${
              correctAnswers?.length || 0
            } correct answers (expected 1).`
          );
        // Podrían añadirse más logs específicos si es necesario

        if (attempt === maxAttempts)
          throw new Error(`Validation failed after ${maxAttempts} attempts.`);
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500)
        );
        continue;
      }

      // --- Éxito: Pregunta válida ---
      console.log(
        `[Attempt ${attempt}] Successfully generated and validated question for category ${entryCategory}.`
      );

      // --- Guardar en questionsservice (opcional pero mantenido) ---
      const formattedQuestion = {
        question: parsedResponse.question,
        correctAnswer: correctAnswers[0].text, // Ya sabemos que hay exactamente 1
        incorrectAnswers: parsedResponse.answers
          .filter((a) => !a.isCorrect)
          .map((a) => a.text),
        category: entryCategory,
      };
      // Ejecutar en segundo plano sin esperar (fire and forget) o manejar errores si es crítico
      fetch("http://questionsservice:8005/addQuestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedQuestion),
      })
        .then(async (postResponse) => {
          if (!postResponse.ok) {
            console.error(
              "[generateQuestionForEntry] BG Error posting to questionsservice:",
              await postResponse.text()
            );
          } else {
            // console.log("[generateQuestionForEntry] BG Question sent to questionsservice.");
          }
        })
        .catch((postError) => {
          console.error(
            "[generateQuestionForEntry] BG Network error posting to questionsservice:",
            postError.message
          );
        });
      // --- Fin Guardado ---

      return parsedResponse; // Devolver la pregunta parseada y validada
    } catch (error) {
      // Captura error si se lanza al final de los reintentos
      console.error(
        `[generateQuestionForEntry Attempt ${attempt}] Failed:`,
        error.message
      );
      if (attempt === maxAttempts) {
        console.error(
          `[generateQuestionForEntry] All ${maxAttempts} attempts failed for entry.`
        );
        return null; // Devolver null si todos los intentos fallan para esta entrada
      }
      // Esperar antes del siguiente intento si no es el último
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 500)
      );
    }
  }
  // Si el bucle termina sin retornar (fallo inesperado)
  console.error(
    "[generateQuestionForEntry] Loop finished unexpectedly without success or final error."
  );
  return null;
}

// --- Endpoints Principales ---

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Endpoint /generateQuestions
app.post("/generateQuestions", async (req, res) => {
  console.log("[/generateQuestions] Received request.");
  try {
    const questionCount = parseInt(req.body.questionCount, 10) || 4;
    const category = req.body.category || "variado";
    const apiKey = req.body.apiKey;

    console.log(
      `[/generateQuestions] Requesting ${questionCount} questions for category: ${category}`
    );

    // 1. Obtener Entradas de Wikidata
    let entries = [];
    if (category === "variado") {
      entries = await getMultipleRandomEntries(questionCount); // Ya maneja errores internos
    } else {
      const normalizedCategory = category
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      // Pedir N entradas individualmente
      const categoryEntriesPromises = Array.from(
        { length: questionCount },
        () => getWikidataForCategory(normalizedCategory, 1)
      );
      const results = await Promise.allSettled(categoryEntriesPromises);
      entries = results
        .filter((r) => r.status === "fulfilled" && r.value) // Solo las exitosas
        .map((r) => ({ data: r.value })); // Mapear al formato { data: ... }
    }

    if (entries.length === 0) {
      console.error(
        `[/generateQuestions] Could not retrieve ANY valid Wikidata entries for category: ${category}`
      );
      // Devolver un error si no se obtuvieron datos base
      return res.status(503).json({
        error: `No se pudieron obtener datos base para la categoría '${category}'. El servicio Wikidata podría no estar disponible o la categoría no existe.`,
      });
    }
    console.log(
      `[/generateQuestions] Retrieved ${entries.length} entries. Generating questions with retries...`
    );

    // 2. Generar Preguntas (usando la función con retries)
    const questionPromises = entries.map((entry) =>
      generateQuestionForEntry(entry, apiKey)
    );
    const generatedResults = await Promise.all(questionPromises); // Esperar todas las generaciones (con sus retries internos)
    const validQuestions = generatedResults.filter((q) => q !== null); // Filtrar las que fallaron definitivamente

    console.log(
      `[/generateQuestions] Generation finished. Valid questions obtained: ${validQuestions.length} / ${entries.length} entries processed.`
    );

    // 3. Devolver Respuesta
    if (validQuestions.length > 0) {
      // Si se obtuvo al menos UNA pregunta válida
      if (
        validQuestions.length < questionCount &&
        entries.length >= questionCount
      ) {
        // Advertir si se obtuvieron menos de las solicitadas (y se tenían suficientes entradas)
        console.warn(
          `[/generateQuestions] Returning partial list: ${validQuestions.length}/${questionCount} requested questions were successfully generated and validated.`
        );
      }
      // Devolver las preguntas válidas obtenidas
      const responseObject = {
        questions: validQuestions.map((q) => ({
          question: q.question,
          answers: q.answers, // Mantener el formato esperado por el frontend
        })),
      };
      return res.json(responseObject);
    } else {
      // Si CERO preguntas fueron válidas después de todos los intentos
      console.error(
        "[/generateQuestions] Failed to generate ANY valid questions after all attempts."
      );
      // Devolver el error específico indicando fallo persistente
      return res.status(500).json({
        error:
          "No se pudieron generar preguntas válidas. El LLM no siguió el formato o la validación falló persistentemente incluso tras reintentos.",
      });
    }
  } catch (error) {
    // Captura errores generales no esperados del endpoint
    console.error(
      "[/generateQuestions] General Uncaught Error in Endpoint:",
      error
    );
    res.status(500).json({
      error:
        "Failed to generate questions due to an unexpected server error: " +
        error.message,
    });
  }
});

// Endpoint /generateImage
app.post("/generateImage", async (req, res) => {
  console.log("[/generateImage] Received request.");
  try {
    validateRequiredFields(req, ["prompt"]);
    const { prompt, apiKey } = req.body;
    const base64Image = await sendImageRequestToGemini(prompt, apiKey);
    res.json({ imageUrl: base64Image });
  } catch (error) {
    console.error("[/generateImage Endpoint] Error:", error.message);
    const statusCode = error.message.includes("Missing") ? 400 : 500;
    res
      .status(statusCode)
      .json({ error: "Could not generate image: " + error.message });
  }
});

// Endpoint /generateImages
app.post("/generateImages", async (req, res) => {
  console.log("[/generateImages] Received request.");
  try {
    validateRequiredFields(req, ["questions"]);
    const { questions, apiKey } = req.body;
    if (
      !Array.isArray(questions) ||
      questions.length === 0 ||
      !questions.every(
        (q) => q && typeof q.question === "string" && q.question.trim() !== ""
      )
    ) {
      return res.status(400).json({
        error:
          "Field 'questions' must be a non-empty array of objects with a non-empty 'question' string property.",
      });
    }
    console.log(
      `[/generateImages] Generating ${questions.length} images concurrently...`
    );
    const imageGenerationPromises = questions.map((q) =>
      sendImageRequestToGemini(q.question, apiKey)
    );
    const results = await Promise.allSettled(imageGenerationPromises);
    console.log(
      `[/generateImages] Image generation finished. Processing ${results.length} results.`
    );
    const imagesData = results.map((result, index) => {
      const originalQuestionText = questions[index].question;
      if (result.status === "fulfilled") {
        return {
          questionText: originalQuestionText,
          base64Image: result.value,
        };
      } else {
        console.error(
          `[/generateImages] Failed for question index ${index} ("${originalQuestionText.substring(
            0,
            30
          )}..."). Reason:`,
          result.reason?.message || result.reason
        );
        return { questionText: originalQuestionText, base64Image: null };
      }
    });
    res.json({ images: imagesData });
  } catch (error) {
    console.error("[/generateImages Endpoint] General Error:", error);
    const statusCode = error.message.startsWith("Missing") ? 400 : 500;
    res.status(statusCode).json({
      error: "Failed to process image generation request: " + error.message,
    });
  }
});

// Endpoint /configureAssistant
app.post("/configureAssistant", (req, res) => {
  try {
    validateRequiredFields(req, ["moderation"]);
    if (typeof req.body.moderation !== "string")
      throw new Error("Invalid moderation prompt type (must be string).");
    moderation = req.body.moderation;
    console.log("Moderation prompt updated.");
    res.json({ message: "Moderation prompt updated" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint /ask
app.post("/ask", async (req, res) => {
  console.log("[/ask] Received request.");
  try {
    validateRequiredFields(req, ["question"]);
    const { question, apiKey } = req.body;
    const answer = await sendQuestionToLLM(question, apiKey, moderation);
    if (typeof answer === "string" && answer.startsWith("LLM_ERROR:")) {
      res.status(500).json({ error: answer });
    } else {
      res.json({ answer });
    }
  } catch (error) {
    console.error("[/ask] Error:", error);
    res
      .status(error.message.startsWith("Missing") ? 400 : 500)
      .json({ error: "Failed to get answer: " + error.message });
  }
});

// --- Endpoints de Pistas  ---
app.post("/getHint", async (req, res) => {
  console.log("[/getHint] Received request.");
  try {
    validateRequiredFields(req, ["question", "answers"]);
    const { question, answers, apiKey } = req.body;
    // Basic validation
    if (
      typeof question !== "string" ||
      !Array.isArray(answers) ||
      !answers.every((a) => a && typeof a.text === "string")
    ) {
      return res
        .status(400)
        .json({ error: "Invalid input types for question or answers." });
    }
    const answerTexts = answers.map((a) => a.text).join("; ");
    const prompt = `Eres un asistente para un juego de quiz. No des la respuesta directamente. Pregunta: "${question}" Opciones: ${answerTexts}. Genera una pista útil y corta (una frase) sobre la pregunta o el tema general. NO menciones ninguna opción específica. NO digas cuál es la respuesta correcta. SOLO la frase de la pista.`;
    const hintResponse = await sendQuestionToLLM(prompt, apiKey, moderation);
    if (
      typeof hintResponse === "string" &&
      hintResponse.startsWith("LLM_ERROR:")
    ) {
      return res.status(500).json({ error: hintResponse });
    }
    const cleanedHint = hintResponse.split("\n")[0].trim(); // Tomar solo la primera línea
    res.json({ hint: cleanedHint || "No pude generar una pista esta vez." });
  } catch (error) {
    console.error("[/getHint] Error:", error);
    res
      .status(error.message.startsWith("Missing") ? 400 : 500)
      .json({ error: "Failed to generate hint: " + error.message });
  }
});

app.post("/getHintWithQuery", async (req, res) => {
  console.log("[/getHintWithQuery] Received request.");
  try {
    validateRequiredFields(req, ["question", "answers", "userQuery"]);
    const { question, answers, userQuery, apiKey } = req.body;
    // Stronger check against asking for the answer
    const forbiddenPatterns = [
      /respuesta/i,
      /answer/i,
      /correcta/i,
      /correct/i,
      /cuál es/i,
      /dime la/i,
      /which one is/i,
    ];
    if (forbiddenPatterns.some((pattern) => pattern.test(userQuery))) {
      return res.json({
        hint: "Lo siento, no puedo darte la respuesta directamente. ¡Intenta adivinar o pide una pista diferente!",
      });
    }
    const answerTexts = answers.map((a) => a.text).join("; ");
    const prompt = `Eres un asistente de chat para un juego de quiz. No des la respuesta correcta. La pregunta actual es: "${question}". Las opciones son: ${answerTexts}. El usuario pregunta: "${userQuery}". Responde a la consulta del usuario de forma útil pero SIN REVELAR LA RESPUESTA CORRECTA. Si pregunta algo no relacionado, indica que te centres en la pregunta. Genera SOLO la respuesta del asistente (1-2 frases).`;
    const hintResponse = await sendQuestionToLLM(prompt, apiKey, moderation);
    if (
      typeof hintResponse === "string" &&
      hintResponse.startsWith("LLM_ERROR:")
    ) {
      return res.status(500).json({ error: hintResponse });
    }
    const cleanedHint = hintResponse.split("\n")[0].trim();
    res.json({
      hint:
        cleanedHint ||
        "No estoy seguro de cómo responder a eso sin dar la respuesta.",
    });
  } catch (error) {
    console.error("[/getHintWithQuery] Error:", error);
    res
      .status(error.message.startsWith("Missing") ? 400 : 500)
      .json({ error: "Failed to generate chat hint: " + error.message });
  }
});

// --- Iniciar Servidor ---
const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
  // Advertencias de inicialización
  if (!genAI) {
    console.error(
      "CRITICAL WARNING: Global GoogleGenAI client (genAI) failed to initialize."
    );
  }
  if (!process.env.LLM_API_KEY) {
    console.warn(
      "WARNING: Environment variable LLM_API_KEY is not configured."
    );
  }
  if (!process.env.WIKIDATA_SERVICE_URL) {
    console.warn(
      "WARNING: Environment variable WIKIDATA_SERVICE_URL is not configured."
    );
  }
  if (!process.env.CORS_ORIGIN) {
    console.warn(
      `WARNING: CORS_ORIGIN not set, defaulting to 'http://localhost:3000'. Ensure this matches your frontend URL.`
    );
  }
});

module.exports = server;
