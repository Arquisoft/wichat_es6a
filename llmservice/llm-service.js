const axios = require("axios");
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
const port = process.env.PORT || 8003;
let moderation = "You are a quiz game assistant.";
require("dotenv").config();

const WIKIDATA_SERVICE_URL =
  process.env.WIKIDATA_SERVICE_URL || "http://wikidataservice:8020/api";

app.use(express.json({ limit: "10mb" }));

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
  } catch (initError) {
    console.error(
      "FATAL ERROR: No se pudo inicializar GoogleGenAI con la API Key del entorno:",
      initError.message
    );
    genAI = null;
  }
} else {
  console.error("FATAL ERROR: LLM_API_KEY no está definida en el entorno.");
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

// Función para validar campos requeridos en el body de la request
function validateRequiredFields(req, requiredFields) {
  for (const field of requiredFields) {
    if (
      !(field in req.body) ||
      req.body[field] === undefined ||
      req.body[field] === null
    ) {
      if (req.body[field] !== 0 && req.body[field] !== false) {
        throw new Error(`Missing or invalid required field: ${field}`);
      }
    }
    if (
      Array.isArray(req.body[field]) &&
      req.body[field].length === 0 &&
      (field === "questions" || field === "answers")
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
        "[sendImageRequestToGemini] Usando cliente temporal con apiKey proporcionada."
      );
    } catch (tempClientError) {
      console.error(
        "[sendImageRequestToGemini] Error creando cliente temporal:",
        tempClientError.message
      );
      if (!genAI)
        throw new Error(
          "Fallo al crear cliente de API y el global no está disponible."
        );
      console.warn(
        "[sendImageRequestToGemini] Usando cliente global como fallback."
      );
      client = genAI;
    }
  }
  if (!client)
    throw new Error("API Key for image generation is missing or invalid.");

  try {
    const modelName = "gemini-2.0-flash-exp-image-generation";
    console.log(
      `[sendImageRequestToGemini] Using model: ${modelName}. Prompt: "${prompt.substring(
        0,
        50
      )}..."`
    );

    // Prompt detallado para la generación de imagen
    const imageGenPrompt = `Visually represent the main concept of the following idea in an image, without including any text. Focus on the core concept and create an image that captures its essence. Do not include any letters or words in the image. Use an animated movie style. Return the image as a base64-encoded string. The Idea to represent: ${prompt}`;

    const response = await client.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: imageGenPrompt }] }],
      config: {
        responseModalities: ["Text", "Image"],
      },
    });
    // Extraer la imagen de la respuesta
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

    // Construir y devolver la URL de datos base64
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
    throw error;
  }
}

// Endpoint para generar UNA imagen
app.post("/generateImage", async (req, res) => {
  console.log("[/generateImage] Received request.");
  try {
    validateRequiredFields(req, ["prompt"]);
    const { prompt, apiKey } = req.body;
    console.log("[/generateImage] Calling sendImageRequestToGemini...");
    const base64Image = await sendImageRequestToGemini(prompt, apiKey);
    console.log("[/generateImage] Image generated successfully.");
    // Devolver como 'imageUrl' por consistencia con frontend original
    res.json({ imageUrl: base64Image });
  } catch (error) {
    console.error("[/generateImage Endpoint] Error:", error.message);
    const statusCode = error.message.includes("Missing") ? 400 : 500;
    res
      .status(statusCode)
      .json({ error: "No se pudo generar la imagen: " + error.message });
  }
});

// Endpoint para generar MÚLTIPLES imágenes
app.post("/generateImages", async (req, res) => {
  console.log("[/generateImages] Received request.");
  try {
    validateRequiredFields(req, ["questions"]); // Valida que 'questions' exista
    const { questions, apiKey } = req.body;

    // Validación más específica del contenido de 'questions'
    if (
      !Array.isArray(questions) ||
      questions.length === 0 ||
      !questions.every(
        (q) => q && typeof q.question === "string" && q.question.trim() !== ""
      )
    ) {
      return res.status(400).json({
        error:
          "El campo 'questions' debe ser un array no vacío de objetos con una propiedad 'question' (string no vacío).",
      });
    }

    console.log(
      `[/generateImages] Generating ${questions.length} images concurrently...`
    );

    // Usar Promise.allSettled para manejar errores individuales
    const imageGenerationPromises = questions.map(
      (q) => sendImageRequestToGemini(q.question, apiKey) // Llama a la función centralizada
    );
    const results = await Promise.allSettled(imageGenerationPromises);

    console.log(
      `[/generateImages] Image generation finished. Processing ${results.length} results.`
    );

    // Mapear resultados
    const imagesData = results.map((result, index) => {
      const originalQuestionText = questions[index].question;
      if (result.status === "fulfilled") {
        // Éxito
        return {
          questionText: originalQuestionText,
          base64Image: result.value,
        };
      } else {
        // Fallo
        console.error(
          `[/generateImages] Failed for question index ${index} ("${originalQuestionText.substring(
            0,
            30
          )}..."). Reason:`,
          result.reason?.message || result.reason
        );
        return { questionText: originalQuestionText, base64Image: null }; // Indicar fallo
      }
    });

    res.json({ images: imagesData });
  } catch (error) {
    // Captura errores de validación inicial o inesperados
    console.error("[/generateImages Endpoint] General Error:", error);
    const statusCode = error.message.startsWith("Missing") ? 400 : 500;
    res.status(statusCode).json({
      error: "Failed to process image generation request: " + error.message,
    });
  }
});

// Función genérica para enviar preguntas al LLM
async function sendQuestionToLLM(question, apiKey, moderation) {
  try {
    const modelProvider = process.env.LLM_PROVIDER || "gemini"; // Usar gemini por defecto
    const config = llmConfigs[modelProvider];
    if (!config)
      throw new Error(`Model provider '${modelProvider}' is not supported.`);

    const effectiveApiKey = apiKey || process.env.LLM_API_KEY;
    // Validar que la key exista si es necesaria para el proveedor
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
    const headers = config.headers(effectiveApiKey);

    console.log(`[sendQuestionToLLM] Sending request to ${modelProvider}...`);
    const response = await axios.post(url, requestData, { headers });
    console.log(`[sendQuestionToLLM] Received response from ${modelProvider}.`);
    return config.transformResponse(response);
  } catch (error) {
    console.error(
      `Error sending question to ${process.env.LLM_PROVIDER || "gemini"}:`,
      error.response?.data || error.message
    );
    return `LLM_ERROR: Failed to process request - ${error.message}`;
  }
}

// Función para limpiar y parsear respuestas JSON del LLM
function parseJsonResponse(jsonString) {
  if (typeof jsonString !== "string") {
    if (typeof jsonString === "object" && jsonString !== null)
      return jsonString;
    throw new Error("Invalid input: Expected a JSON string.");
  }
  try {
    return JSON.parse(jsonString);
  } catch (e1) {
    try {
      const cleanedJson = jsonString
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "")
        .trim();
      const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
      if (jsonMatch && jsonMatch[0]) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e_match) {}
      }
      // Si no hay match o falla, intentar parsear el string limpiado (último recurso)
      return JSON.parse(cleanedJson);
    } catch (e2) {
      console.error(
        "[parseJsonResponse] All JSON parsing attempts failed.",
        e1.message,
        e2.message,
        "Original string:",
        jsonString.substring(0, 200) + "..."
      );
      throw new Error(
        "Could not parse LLM response as JSON after multiple attempts."
      );
    }
  }
}

// Ruta para configurar el prompt del asistente
app.post("/configureAssistant", (req, res) => {
  try {
    validateRequiredFields(req, ["moderation"]);
    if (typeof req.body.moderation !== "string") {
      throw new Error("Invalid moderation prompt type (must be string).");
    }
    moderation = req.body.moderation;
    console.log("Moderation prompt updated.");
    res.json({ message: "Moderation prompt updated" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para enviar una pregunta genérica al LLM
app.post("/ask", async (req, res) => {
  console.log("[/ask] Received request.");
  try {
    validateRequiredFields(req, ["question"]);
    const { question, apiKey } = req.body;
    console.log("[/ask] Sending question to LLM...");
    const answer = await sendQuestionToLLM(question, apiKey, moderation);
    console.log("[/ask] Received answer from LLM.");
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

// --- Funciones Wikidata ---
async function getWikidataForCategory(category, count = 1) {
  try {
    console.log(
      `[getWikidataForCategory] Getting ${count} entries for category: ${category}`
    );
    const response = await axios.get(
      `${WIKIDATA_SERVICE_URL}/entries/${category}?count=${count}`
    );
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
    return null;
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
  console.log(
    `[getMultipleRandomEntries] Attempting to get ${questionsCount} random entries...`
  );
  const entriesPromises = Array.from({ length: questionsCount }, () =>
    getWikidataRandomEntry()
  );
  const results = await Promise.allSettled(entriesPromises);
  const validEntries = results
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => ({ data: result.value }));
  console.log(
    `[getMultipleRandomEntries] Successfully obtained ${validEntries.length} random entries.`
  );
  return validEntries;
}
function formatEntryInfo(entry) {
  if (!entry?.data) return "";
  const { category, ...data } = entry.data; // Extraer categoría y resto de datos
  let info = "";
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
  return info.replace(/, [^:]+: \?/g, "");
}

async function generateQuestionForEntry(entry, apiKey) {
  console.log("Generando pregunta para la entrada:", entry?.data?.category);
  const entryInfo = formatEntryInfo(entry);
  if (!entryInfo) {
    console.error(
      "No se pudo formatear la información para la entrada:",
      entry
    );
    return null;
  }

  const prompt = `A partir del siguiente texto: "${entryInfo}", genera 1 pregunta de opción múltiple para un juego de quiz.
La pregunta debe tener exactamente 4 opciones de respuesta.
Exactamente UNA de las opciones debe ser la correcta, basada estrictamente en la información "${entryInfo}".
Las otras TRES opciones deben ser incorrectas pero plausibles y relacionadas con el tema.
NO incluyas la respuesta correcta directamente en el texto de la pregunta si es el sujeto principal (ej. no preguntes "¿Quién dirigió la película X?" si la info es "Película: X, Director: Y"). En su lugar, pregunta por una característica.
Si la información es sobre una capital (ej. "País: España, Capital: Madrid"), pregunta "¿Cuál es la capital de España?".
Si la información es sobre un símbolo químico (ej. "Elemento: Oro, Símbolo: Au"), pregunta "¿Cuál es el símbolo químico del Oro?".

Información Base: "${entryInfo}"

Formato de Respuesta OBLIGATORIO (solo el objeto JSON, sin texto adicional antes o después, usando comillas dobles válidas):
{
  "question": "Texto de la pregunta aquí",
  "answers": [
    { "text": "Texto respuesta correcta", "isCorrect": true },
    { "text": "Texto respuesta incorrecta 1", "isCorrect": false },
    { "text": "Texto respuesta incorrecta 2", "isCorrect": false },
    { "text": "Texto respuesta incorrecta 3", "isCorrect": false }
  ]
}`;

  try {
    const llmResponse = await sendQuestionToLLM(prompt, apiKey, moderation);

    if (
      typeof llmResponse === "string" &&
      llmResponse.startsWith("LLM_ERROR:")
    ) {
      console.error(
        "[generateQuestionForEntry] Error received from sendQuestionToLLM:",
        llmResponse
      );
      return null;
    }
    if (typeof llmResponse !== "string") {
      console.error(
        "[generateQuestionForEntry] Unexpected response type from sendQuestionToLLM:",
        llmResponse
      );
      return null;
    }

    // *** Validación después del Parseo ***
    try {
      const parsedResponse = parseJsonResponse(llmResponse);

      // Validación de estructura y tipos
      if (
        !parsedResponse ||
        typeof parsedResponse.question !== "string" ||
        !parsedResponse.question.trim() ||
        !Array.isArray(parsedResponse.answers) ||
        parsedResponse.answers.length !== 4 ||
        !parsedResponse.answers.every(
          (a) =>
            a &&
            typeof a.text === "string" &&
            a.text.trim() &&
            typeof a.isCorrect === "boolean"
        )
      ) {
        console.error(
          "[generateQuestionForEntry] Parsed response has invalid structure, types, or empty strings:",
          JSON.stringify(parsedResponse)
        );
        return null;
      }

      // Validación de número de respuestas correctas
      const correctAnswersCount = parsedResponse.answers.filter(
        (a) => a.isCorrect === true
      ).length;
      if (correctAnswersCount !== 1) {
        console.error(
          `[generateQuestionForEntry] Parsed response has ${correctAnswersCount} correct answers (expected 1):`,
          JSON.stringify(parsedResponse)
        );
        return null;
      }

      console.log(
        `[generateQuestionForEntry] Successfully generated and validated question for category ${entry?.data?.category}`
      );
      return parsedResponse;
    } catch (parseOrValidationError) {
      console.error(
        "[generateQuestionForEntry] Error parsing or validating LLM response:",
        parseOrValidationError.message,
        "Raw response:",
        llmResponse.substring(0, 500) + "..."
      );
      return null;
    }
  } catch (error) {
    console.error("Error en llamada a LLM para generar pregunta:", error);
    return null;
  }
}

// Endpoint para generar preguntas (usa la función corregida y validada)
app.post("/generateQuestions", async (req, res) => {
  console.log("[/generateQuestions] Received request.");
  try {
    const questionCount = parseInt(req.body.questionCount, 10) || 4;
    const category = req.body.category || "variado";
    const apiKey = req.body.apiKey;

    console.log(
      `[/generateQuestions] Generating ${questionCount} questions for category: ${category}`
    );

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
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => ({ data: r.value }));
    }

    if (entries.length === 0) {
      console.error(
        `[/generateQuestions] Could not retrieve any Wikidata entries for category: ${category}`
      );
      return res.status(500).json({
        error: `No se pudieron obtener datos para la categoría '${category}'`,
      });
    }
    console.log(
      `[/generateQuestions] Retrieved ${entries.length} entries. Generating questions...`
    );

    const questionPromises = entries.map((entry) =>
      generateQuestionForEntry(entry, apiKey)
    );
    const generatedQuestions = await Promise.all(questionPromises);

    // Filtrar las que no son null (pasaron la validación)
    const validQuestions = generatedQuestions.filter((q) => q !== null);

    console.log(
      `[/generateQuestions] Successfully generated ${validQuestions.length} valid questions out of ${entries.length} entries.`
    );

    if (validQuestions.length === 0) {
      console.error(
        "[/generateQuestions] Failed to generate any valid questions."
      );
      return res.status(500).json({
        error:
          "No se pudieron generar preguntas válidas. El LLM podría no estar siguiendo el formato o la validación falló.",
      });
    }

    const responseObject = {
      questions: validQuestions.map((q) => ({
        question: q.question,
        answers: q.answers,
      })),
    };
    return res.json(responseObject);
  } catch (error) {
    console.error("[/generateQuestions] General Error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate questions: " + error.message });
  }
});

// --- Endpoints de Pistas (/getHint, /getHintWithQuery) ---
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
    const prompt = `Eres un asistente para un juego de quiz... Pregunta: "${question}" Respuestas Posibles: ${answerTexts} ... Genera SOLO la frase de la pista.`; // Prompt completo omitido
    console.log("[/getHint] Sending prompt to LLM for hint generation...");
    const hintResponse = await sendQuestionToLLM(prompt, apiKey, moderation);
    if (
      typeof hintResponse === "string" &&
      hintResponse.startsWith("LLM_ERROR:")
    ) {
      return res.status(500).json({ error: hintResponse });
    }
    const cleanedHint = hintResponse.split("\n")[0].trim();
    res.json({ hint: cleanedHint });
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
    const forbiddenWords = [
      "respuesta",
      "answer",
      "right",
      "correct",
      "correcta",
      "cuál es",
    ];
    if (forbiddenWords.some((word) => userQuery.toLowerCase().includes(word))) {
      return res.json({
        hint: "Lo siento, no puedo darte la respuesta directamente. ¡Intenta adivinar!",
      });
    }
    const answerTexts = answers.map((a) => a.text).join("; ");
    const prompt = `Eres un asistente de chat... Pregunta Actual: "${question}" Opciones: ${answerTexts} Consulta: "${userQuery}" ... Genera SOLO la respuesta del asistente.`; // Prompt completo omitido
    console.log("[/getHintWithQuery] Sending prompt to LLM for chat hint...");
    const hintResponse = await sendQuestionToLLM(prompt, apiKey, moderation);
    if (
      typeof hintResponse === "string" &&
      hintResponse.startsWith("LLM_ERROR:")
    ) {
      return res.status(500).json({ error: hintResponse });
    }
    const cleanedHint = hintResponse.split("\n")[0].trim();
    res.json({ hint: cleanedHint });
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
  if (!genAI) {
    console.error(
      "ERROR CRÍTICO: El cliente global GoogleGenAI (genAI) no se pudo inicializar."
    );
  }
  if (!process.env.LLM_API_KEY) {
    console.warn(
      "ADVERTENCIA: La variable de entorno LLM_API_KEY no está configurada."
    );
  }
  if (!process.env.WIKIDATA_SERVICE_URL) {
    console.warn(
      "ADVERTENCIA: La variable de entorno WIKIDATA_SERVICE_URL no está configurada."
    );
  }
});

module.exports = server;
