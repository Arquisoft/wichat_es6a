// Importaciones
const axios = require("axios");
const express = require("express");
const cors = require("cors");
// GoogleGenAI se mantiene solo si se usa Gemini como proveedor de LLM para TEXTO
const { GoogleGenAI } = require("@google/genai");

const swaggerUi = require('swagger-ui-express'); 
const fs = require("fs")
const YAML = require('yaml');

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
// URL del wikidata-service (que ahora DEBE devolver imageUrl)
const WIKIDATA_SERVICE_URL = "http://gatewayservice:8000/api";

// Middlewares de Express
app.use(express.json({ limit: "10mb" })); // Parsear JSON con límite de tamaño

// Middleware para inyectar API Key desde entorno si no viene en request
app.use((req, res, next) => {
  if (!req.body.apiKey && process.env.LLM_API_KEY) {
    req.body.apiKey = process.env.LLM_API_KEY;
  }
  next();
});

// Inicializar cliente global de GoogleGenAI (SOLO si se usa para TEXTO)
let genAI = null;
// Solo inicializar si se usa Gemini como proveedor Y hay API key
if (process.env.LLM_PROVIDER === "gemini" && process.env.LLM_API_KEY) {
  try {
    genAI = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
    console.log(
      "GoogleGenAI client initialized successfully (for text generation)."
    );
  } catch (initError) {
    console.error(
      "ERROR: Could not initialize GoogleGenAI client:",
      initError.message
    );
    genAI = null; // Asegurar que es null si falla
  }
} else if (process.env.LLM_PROVIDER === "gemini" && !process.env.LLM_API_KEY) {
  console.error(
    "ERROR: LLM_PROVIDER is 'gemini' but LLM_API_KEY is not defined."
  );
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
      model: "qwen/Qwen2.5-Coder-7B-Instruct", // Revisa si este modelo sigue siendo válido/deseado
      stream: false,
      messages: [
        { role: "system", content: moderation },
        { role: "user", content: question },
      ],
    }),
    transformResponse: (response) =>
      response.data.choices?.[0]?.message?.content || "No response",
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`, // Asume que Empathy necesita API Key aquí
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

// Función genérica para enviar preguntas al LLM
async function sendQuestionToLLM(question, apiKey, moderation) {
  try {
    const modelProvider = process.env.LLM_PROVIDER || "gemini"; // Default a gemini
    const config = llmConfigs[modelProvider];
    if (!config)
      throw new Error(`Model provider '${modelProvider}' is not supported.`);

    const effectiveApiKey = apiKey || process.env.LLM_API_KEY;
    // Verificar API key solo si es necesaria para el proveedor
    if (!effectiveApiKey && modelProvider !== "empathy") {
      console.error(
        `[sendQuestionToLLM] API Key missing for provider ${modelProvider}`
      );
      throw new Error(
        `API Key is required for LLM provider '${modelProvider}'.`
      );
    }

    const url = config.url();
    const requestData = config.transformRequest(question, moderation);
    const headers = config.headers(effectiveApiKey); // Pasa la API key si es necesaria

    // Comentado para reducir verbosidad en logs normales
    // console.log(`[sendQuestionToLLM] Sending request to ${modelProvider}...`);
    const response = await axios.post(url, requestData, { headers });
    // console.log(`[sendQuestionToLLM] Received response from ${modelProvider}.`);
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
// Llaman al wikidata-service y esperan que devuelva imageUrl
async function getWikidataForCategory(category, count = 1) {
  try {
    const response = await axios.get(
      `${WIKIDATA_SERVICE_URL}/entries/${category}?count=${count}`
    );
    // ASUNCIÓN: response.data (o response.data[0]) AHORA CONTIENE { ..., imageUrl: "..." }
    return count === 1 &&
      Array.isArray(response.data) &&
      response.data.length > 0
      ? response.data[0]
      : response.data;
  } catch (error) {
    console.error(
      `[getWikidataForCategory] Error getting Wikidata for ${category}:`,
      error.response?.data?.error || error.response?.status || error.message
    );
    return null; // Devolver null en caso de error
  }
}

async function getWikidataRandomEntry() {
  try {
    const response = await axios.get(`${WIKIDATA_SERVICE_URL}/entries/random`);
    // ASUNCIÓN: response.data AHORA CONTIENE { ..., imageUrl: "..." }
    return response.data;
  } catch (error) {
    console.error(
      "[getWikidataRandomEntry] Error getting random entry:",
      error.response?.data?.error || error.response?.status || error.message
    );
    return null;
  }
}

async function getMultipleRandomEntries(questionsCount = 10) {
  // console.log(`[getMultipleRandomEntries] Attempting to get ${questionsCount} random entries...`);
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

// Formatea solo la parte textual para el prompt del LLM
function formatEntryInfo(entry) {
  if (!entry?.data) return "";
  // Excluir imageUrl y category del formateo textual para el prompt
  const { category, imageUrl, ...data } = entry.data;
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
      // Intenta usar un campo genérico si existe, o marca como desconocido
      info = `Concepto: ${data.label || data.itemLabel || "Desconocido"}`;
  }
  // Limpiar campos desconocidos de la cadena resultante
  return info.replace(/, [^:]+: \?/g, "").replace(/[^:]+: \?, /g, "");
}

// --- Función de Generación de Pregunta MODIFICADA ---
async function generateQuestionForEntry(entry, apiKey, maxAttempts = 3) {
  // Extraer datos textuales Y la imageUrl recibida del wikidata-service
  const entryInfo = formatEntryInfo(entry); // Formatea solo el texto
  const imageUrlFromWikidata = entry?.data?.imageUrl || null; // Extrae la URL

  // Si no hay información textual, no podemos generar pregunta basada en texto
  if (!entryInfo) {
    console.warn(
      "[generateQuestionForEntry] No text info formattable for entry:",
      entry
    );
    return null; // Opcionalmente podrías devolver { imageUrl: imageUrlFromWikidata, ... } si quieres preguntas solo con imagen
  }

  const entryCategory = entry?.data?.category || "variado";

  // Prompt para el LLM (solo para generar texto: pregunta y respuestas)
  const prompt = `A partir del siguiente texto: "${entryInfo}", genera 1 pregunta de opción múltiple para un juego de quiz. La pregunta debe tener EXACTAMENTE 4 opciones de respuesta en un array llamado "answers". EXACTAMENTE UNA de las opciones debe ser la correcta, marcada con "isCorrect": true. Las otras TRES opciones deben ser incorrectas ("isCorrect": false) pero plausibles y relacionadas con el tema. NO incluyas la respuesta correcta directamente en el texto de la pregunta si es el sujeto principal (ej. no "¿Quién dirigió X?" si la info es "Película: X, Director: Y"). Pregunta por una característica. Si la info es sobre capital (ej. "País: España, Capital: Madrid"), pregunta "¿Cuál es la capital de España?". Si la info es sobre símbolo químico (ej. "Elemento: Oro, Símbolo: Au"), pregunta "¿Cuál es el símbolo químico del Oro?". Información Base: "${entryInfo}" Formato de Respuesta ESTRICTAMENTE OBLIGATORIO (SOLO el objeto JSON, sin texto adicional antes o después, sin markdown \`\`\`, usando comillas dobles válidas): { "question": "Texto de la pregunta aquí", "answers": [ { "text": "Texto respuesta correcta", "isCorrect": true }, { "text": "Texto respuesta incorrecta 1", "isCorrect": false }, { "text": "Texto respuesta incorrecta 2", "isCorrect": false }, { "text": "Texto respuesta incorrecta 3", "isCorrect": false } ] } EJEMPLO de salida válida para "Elemento: Oro, Símbolo: Au": { "question": "¿Cuál es el símbolo químico del Oro?", "answers": [ { "text": "Au", "isCorrect": true }, { "text": "Ag", "isCorrect": false }, { "text": "Or", "isCorrect": false }, { "text": "Go", "isCorrect": false } ] } Asegúrate de seguir este formato JSON EXACTAMENTE.`;

  // Bucle de reintentos para generar el TEXTO de la pregunta
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // console.log(`[generateQuestionForEntry] Attempt ${attempt}/${maxAttempts} for TEXT entry: ${entryCategory}...`);
    try {
      const llmResponse = await sendQuestionToLLM(prompt, apiKey, moderation);

      // Validación / Parseo / Validación Estructura del JSON (igual que antes)
      if (
        typeof llmResponse === "string" &&
        llmResponse.startsWith("LLM_ERROR:")
      ) {
        console.error(`[Attempt ${attempt}] Error from LLM:`, llmResponse);
        if (attempt === maxAttempts) return null; // Fallo definitivo tras reintentos
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500)
        );
        continue;
      }
      if (
        typeof llmResponse !== "string" ||
        !llmResponse.trim().startsWith("{")
      ) {
        console.error(
          `[Attempt ${attempt}] Invalid response type from LLM:`,
          llmResponse.substring(0, 200)
        );
        if (attempt === maxAttempts) return null;
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500)
        );
        continue;
      }
      let parsedResponse;
      try {
        parsedResponse = parseJsonResponse(llmResponse);
      } catch (parseError) {
        console.error(
          `[Attempt ${attempt}] Error parsing LLM response:`,
          parseError.message
        );
        if (attempt === maxAttempts) return null;
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500)
        );
        continue;
      }
      const correctAnswers = parsedResponse.answers?.filter(
        (a) => a?.isCorrect === true
      );
      const isValid =
        parsedResponse &&
        typeof parsedResponse.question === "string" &&
        parsedResponse.question.trim().length > 0 &&
        Array.isArray(parsedResponse.answers) &&
        parsedResponse.answers.length === 4 &&
        parsedResponse.answers.every(
          (a) =>
            a &&
            typeof a.text === "string" &&
            a.text.trim().length > 0 &&
            typeof a.isCorrect === "boolean"
        ) &&
        correctAnswers?.length === 1;

      if (!isValid) {
        console.error(
          `[Attempt ${attempt}] Validation failed for parsed response:`,
          JSON.stringify(parsedResponse)
        );
        if (attempt === maxAttempts) return null;
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500)
        );
        continue;
      }
      // -----------------------------------------------------------------

      // --- Éxito en la generación de texto ---
      console.log(
        `[Attempt ${attempt}] Successfully generated text question for category ${entryCategory}.`
      );

      // Convertimos al formato requerido para enviar al microservicio
      const formattedQuestion = {
        question: parsedResponse.question,
        correctAnswer: parsedResponse.answers.find((a) => a.isCorrect).text,
        incorrectAnswers: parsedResponse.answers
          .filter((a) => !a.isCorrect)
          .map((a) => a.text),
        category: entryCategory,
        imageUrl: imageUrlFromWikidata,
      };

      // POST al servicio externo
      try {
        const postResponse = await fetch("http://gatewayservice:8000/addQuestion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formattedQuestion),
        });

        if (!postResponse.ok) {
          console.error(
            "[generateQuestionForEntry] Error when sending endpoint package:",
            await postResponse.text()
          );
        } else {
          console.log(
            `[generateQuestionForEntry] Successfully sent question to service for category ${entryCategory}.`
          );
        }
      } catch (postError) {
        console.error("[generateQuestionForEntry] Error fetching POST:", postError);
      }

      // --- Devolver la pregunta (texto) junto con la imagen de Wikidata ---
      return {
        ...parsedResponse, // Contiene question y answers del LLM
        imageUrl: imageUrlFromWikidata,
      };
      //-------------------------------------------------------------
    } catch (error) {
      // Captura errores generales del intento
      console.error(
        `[generateQuestionForEntry Attempt ${attempt}] Failed with error:`,
        error.message
      );
      if (attempt === maxAttempts) {
        console.error(
          `[generateQuestionForEntry] All ${maxAttempts} attempts failed for entry.`
        );
        return null; // Fallo definitivo para esta entrada
      }
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 500)
      ); // Espera antes de reintentar
    }
  } // Fin del bucle for

  console.error(
    "[generateQuestionForEntry] Loop finished unexpectedly without success."
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
      entries = await getMultipleRandomEntries(questionCount);
    } else {
      const normalizedCategory = category
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const categoryEntriesPromises = Array.from(
        { length: questionCount },
        () => getWikidataForCategory(normalizedCategory, 1)
      );
      const results = await Promise.allSettled(categoryEntriesPromises);
      entries = results
        .filter((r) => r.status === "fulfilled" && r.value) // Solo las exitosas
        .map((r) => ({ data: r.value }));
    }

    if (entries.length === 0) {
      console.error(
        `[/generateQuestions] Could not retrieve ANY valid Wikidata entries for category: ${category}`
      );
      return res.status(503).json({
        error: `No se pudieron obtener datos base para la categoría '${category}'.`,
      });
    }
    console.log(
      `[/generateQuestions] Retrieved ${entries.length} entries from wikidata-service. Generating questions...`
    );

    if (entries.length > 0) {
      console.log(
        "[/generateQuestions] First entry received from wikidata-service:",
        JSON.stringify(entries[0], null, 2)
      );
    }

    // 2. Generar Preguntas
    const questionPromises = entries.map((entry) =>
      generateQuestionForEntry(entry, apiKey)
    );
    const generatedResults = await Promise.all(questionPromises);
    const validQuestions = generatedResults.filter((q) => q !== null);

    console.log(
      `[/generateQuestions] Generation finished. Valid questions obtained: ${validQuestions.length} / ${entries.length} entries processed.`
    );

    // 3. Devolver Respuesta
    if (validQuestions.length > 0) {
      if (
        validQuestions.length < questionCount &&
        entries.length >= questionCount
      ) {
        console.warn(
          `[/generateQuestions] Returning partial list: ${validQuestions.length}/${questionCount} requested questions were successfully generated.`
        );
      }
      const responseObject = {
        questions: validQuestions,
      };
      return res.json(responseObject);
    } else {
      console.error(
        "[/generateQuestions] Failed to generate ANY valid questions after all attempts."
      );
      return res
        .status(500)
        .json({ error: "No se pudieron generar preguntas válidas." });
    }
  } catch (error) {
    console.error(
      "[/generateQuestions] General Uncaught Error in Endpoint:",
      error
    );
    res
      .status(500)
      .json({ error: "Error inesperado del servidor: " + error.message });
  }
});

app.post("/configureAssistant", (req, res) => {
  try {
    validateRequiredFields(req, ["moderation"]);
    if (typeof req.body.moderation !== "string")
      throw new Error("Invalid moderation prompt type.");
    moderation = req.body.moderation;
    console.log("Moderation prompt updated.");
    res.json({ message: "Moderation prompt updated" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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

app.post("/getHint", async (req, res) => {
  console.log("[/getHint] Received request.");
  try {
    validateRequiredFields(req, ["question", "answers"]);
    const { question, answers, apiKey } = req.body;
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
    const cleanedHint = hintResponse.split("\n")[0].trim();
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
    const { question, answers, userQuery} = req.body;
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
    const hintResponse = await sendQuestionToLLM(prompt, process.env.LLM_API_KEY, moderation);
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
  // Advertencias de inicialización ajustadas
  if (
    process.env.LLM_PROVIDER === "gemini" &&
    !genAI &&
    process.env.LLM_API_KEY
  ) {
    // Solo advertir si se seleccionó gemini, había key, pero falló la inicialización
    console.error(
      "CRITICAL WARNING: Global GoogleGenAI client (genAI) failed to initialize despite configuration."
    );
  }
  // Advertir si falta la key Y se necesita (no es empathy, por ejemplo)
  if (!process.env.LLM_API_KEY && process.env.LLM_PROVIDER !== "empathy") {
    console.warn(
      `WARNING: Environment variable LLM_API_KEY is not configured but might be needed for provider '${
        process.env.LLM_PROVIDER || "gemini"
      }'.`
    );
  }
  if (!process.env.WIKIDATA_SERVICE_URL) {
    console.warn(
      "WARNING: Environment variable WIKIDATA_SERVICE_URL is not configured."
    );
  }
  if (!process.env.CORS_ORIGIN) {
    console.warn(
      `WARNING: CORS_ORIGIN not set, defaulting to 'http://localhost:3000'.`
    );
  }
});

// **Configuración de Swagger**
openapiPath = './openapi.yaml'
if (fs.existsSync(openapiPath)) {
  const file = fs.readFileSync(openapiPath, 'utf8');
  const swaggerDocument = YAML.parse(file);
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.log("Not configuring OpenAPI. Configuration file not present.")
}

module.exports = {
  server,
  getWikidataForCategory,
  generateQuestionForEntry,
  validateRequiredFields,
  sendQuestionToLLM,
  getWikidataRandomEntry,
  getMultipleRandomEntries,
  formatEntryInfo,
  parseJsonResponse,
};
