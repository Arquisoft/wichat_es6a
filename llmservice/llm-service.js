// llmservice/llm-service.js
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
const port = 8003;
let moderation = "You are a quiz game assistant.";
require("dotenv").config();

// URL del servicio de Wikidata
const WIKIDATA_SERVICE_URL = process.env.WIKIDATA_SERVICE_URL || "http://wikidataservice:8020/api";

// Middleware para parsear JSON
app.use(express.json());

// Agregar apiKey automáticamente en la solicitud si no está presente
app.use((req, res, next) => {
  // Verificar si no se incluye apiKey en el cuerpo de la solicitud
  if (!req.body.apiKey) {
    req.body.apiKey = process.env.LLM_API_KEY; // Usar la API Key desde las variables de entorno
  }
  next();
});

const llmConfigs = {
  gemini: {
    url: () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.LLM_API_KEY}`,
    transformRequest: (question, moderation) => ({
      contents: [
        { role: "user", parts: [{ text: `${moderation}\n${question}` }] }
      ]
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
      stream: false, // No soporta stream=true con axios directamente
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

// Validar campos requeridos
function validateRequiredFields(req, requiredFields) {
  for (const field of requiredFields) {
    if (!(field in req.body)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

// Función genérica para enviar preguntas al LLM
async function sendQuestionToLLM(question, apiKey, moderation) {
  try {
    const model = process.env.LLM_PROVIDER || "gemini";
    const config = llmConfigs[model];
    if (!config) {
      throw new Error(`Model '${model}' is not supported.`);
    }

    const url = config.url();
    const requestData = config.transformRequest(question, moderation);
    const headers = config.headers(apiKey); 

    const response = await axios.post(url, requestData, { headers });

    return config.transformResponse(response);
  } catch (error) {
    console.error(`Error sending question:`, error.response?.data || error.message || error);
    return "Error processing request.";
  }
}

// Función para limpiar y parsear respuestas JSON del LLM
function parseJsonResponse(jsonString) {
  try {
    // Primero intentar parse directo
    return JSON.parse(jsonString);
  } catch (e) {
    // Si falla, intentar limpiar el string
    try {
      const cleanedJson = jsonString
        .replace(/```json|```/g, '') // Eliminar bloques de código
        .replace(/\\n/g, '') // Eliminar newlines escapados
        .replace(/\\"/g, '"') // Convertir comillas escapadas
        .trim();
      
      return JSON.parse(cleanedJson);
    } catch (e2) {
      console.error("Error parsing LLM response as JSON:", e2);
      
      // Como último recurso, intentar extraer el JSON con regex
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e3) {
          console.error("Failed all JSON parsing attempts");
          throw new Error("Could not parse LLM response as JSON");
        }
      } else {
        throw new Error("No JSON object found in LLM response");
      }
    }
  }
}

// Ruta para configurar el prompt del asistente
app.post("/configureAssistant", async (req, res) => {
  if (!req.body.moderation) {
    return res.status(400).json({ error: "Missing moderation prompt" });
  }
  moderation = req.body.moderation;
  res.json({ message: "Moderation prompt updated" });
});

// Ruta para enviar una pregunta
app.post("/ask", async (req, res) => {
  try {
    validateRequiredFields(req, ["question"]);

    const { question, apiKey } = req.body;
    const answer = await sendQuestionToLLM(question, apiKey, moderation);

    res.json({ answer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener datos de WikiData para una categoría específica
async function getWikidataForCategory(category, count = 1) {
  try {
    // Usar el endpoint específico para obtener entradas de una categoría
    const response = await axios.get(`${WIKIDATA_SERVICE_URL}/entries/${category}?count=${count}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener datos de WikiData para ${category}:`, error.message);
    return null;
  }
}

async function getWikidataRandomEntry() {
  try {
    // Usar el endpoint específico para obtener una entrada aleatoria
    const response = await axios.get(`${WIKIDATA_SERVICE_URL}/entries/random`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener entrada aleatoria de WikiData:", error.message);
    return null;
  }
}

// Obtener datos de varias categorías aleatorias
async function getMultipleRandomEntries(questionsCount = 10) {
  /* const categories = [
    "paises", "monumentos", "elementos", "peliculas", 
    "canciones", "formula1", "pinturas"
  ]; */
  
  const entries = [];
  
  // Obtener entradas aleatorias
  for (let i = 0; i < questionsCount; i++) {
    try {
      // Seleccionar una categoría aleatoria
      /* const randomCategory = categories[Math.floor(Math.random() * categories.length)]; */
      
      // Obtener una entrada para la categoría seleccionada
      const categoryData = await getWikidataRandomEntry();
      const randomCategory = categoryData.category;
      
      entries.push({
        data: categoryData
      });
    } catch (error) {
      console.error("Error al obtener entrada aleatoria:", error);
    }
  }

  console.log("Entradas aleatorias:", entries);
  return entries;
}

// Formatear la información según la categoría
function formatEntryInfo(entry) {
  //Codigo para categorias random
  const category =  entry.data.category;
  const data = entry.data;
  //Codigo para una categoria en concreto
  /* const { category, data } = entry; */
  let info = "";
  
  switch (category) {
    case "paises":
      if (data.countryLabel && data.capitalLabel) {
        info = `País: ${data.countryLabel}, Su Capital: ${data.capitalLabel}`;
      }
      break;
    case "monumentos":
      if (data.monumentLabel && data.countryLabel) {
        info = `Monumento: ${data.monumentLabel}, Su País: ${data.countryLabel}`;
      }
      break;
    case "elementos":
      if (data.elementLabel && data.symbol) {
        info = `Elemento: ${data.elementLabel}, Su Símbolo: ${data.symbol}`;
      }
      break;
    case "peliculas":
      if (data.peliculaLabel && data.directorLabel) {
        info = `Película: ${data.peliculaLabel}, Su Director: ${data.directorLabel}`;
      }
      break;
    case "canciones":
      if (data.songLabel && data.artistLabel) {
        info = `Canción: ${data.songLabel}, Su Artista: ${data.artistLabel}`;
      }
      break;
    case "formula1":
      if (data.year && data.winnerLabel) {
        info = `Campeonato de formula 1 año: ${data.year}, Ganador: ${data.winnerLabel}`;
      }
      break;
    case "pinturas":
      if (data.paintingLabel && data.artistLabel) {
        info = `Pintura: ${data.paintingLabel}, Su Autor: ${data.artistLabel}`;
      }
      break;
  }
  
  return info;
}

// Generar una pregunta para una entrada específica
async function generateQuestionForEntry(entry, apiKey) {
  console.log("Generando pregunta para la entrada:", entry);
  const entryInfo = formatEntryInfo(entry);
  
  if (!entryInfo) {
    console.error("No se pudo formatear la información para la entrada:", entry);
    return null;
  }
  
  const prompt = `A partir del siguiente texto: "${entryInfo}", genera 1 pregunta de opción múltiple. 
  La pregunta debe tener 4 respuestas, una correcta y tres incorrectas. Si tiene un codigo buscalo en wikidata.
  Ten en cuenta que el jugador no tiene acceso al nombre del monumento, pelicula, cancion, etc. Por lo que deberas
  mencionarlo en las preguntas.

  Texto: "${entryInfo}"

  Responde en formato JSON, la respuesta debe incluir UNICAMENTE un objeto JSON con la pregunta y respuestas:
  {
    "question": "Pregunta 1",
    "answers": [
      { "text": "Respuesta correcta", "correct": true },
      { "text": "Respuesta incorrecta 1", "correct": false },
      { "text": "Respuesta incorrecta 2", "correct": false },
      { "text": "Respuesta incorrecta 3", "correct": false }
    ]
  }
    
  Responde unicamente con el JSON`;

  try {
    const llmResponse = await sendQuestionToLLM(prompt, apiKey, moderation);
    
    // Intentar parsear la respuesta como JSON
    try {
      // Si la respuesta ya es un objeto, devolverla directamente
      if (typeof llmResponse === 'object' && llmResponse !== null) {
        return llmResponse;
      }
      
      const parsedResponse = parseJsonResponse(llmResponse);
      return parsedResponse;
    } catch (parseError) {
      console.error("Error al parsear la respuesta del LLM:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Error al generar pregunta para la entrada:", error);
    return null;
  }
}

// Servicio 1: Generación de preguntas y respuestas a partir de múltiples entradas de WikiData
app.post("/generateQuestions", async (req, res) => {
  try {
    // Determinar cuántas preguntas generar (predeterminado: 4)
    const questionCount = req.body.questionCount || 4;
    
    console.log(`Generando ${questionCount} preguntas con entradas diferentes de WikiData...`);
    
    // Obtener múltiples entradas aleatorias de WikiData
    const entries = await getMultipleRandomEntries(questionCount);
    
    if (entries.length === 0) {
      return res.status(500).json({ error: "No se pudieron obtener datos de WikiData" });
    }
    
    console.log(`Se obtuvieron ${entries.length} entradas de WikiData`);
    
    // Generar una pregunta para cada entrada
    const questionPromises = entries.map(entry => generateQuestionForEntry(entry, req.body.apiKey));
    const generatedQuestions = await Promise.all(questionPromises);
    
    // Filtrar preguntas nulas o inválidas
    const validQuestions = generatedQuestions.filter(q => q !== null);
    
    if (validQuestions.length === 0) {
      return res.status(500).json({ error: "No se pudieron generar preguntas válidas" });
    }
    
    // Formatear respuesta
    const responseObject = {
      questions: validQuestions.map(q => ({
        question: q.question,
        answers: q.answers
      }))
    };
    
    return res.json(responseObject);
  } catch (error) {
    console.error("Error general en /generateQuestions:", error);
    res.status(500).json({ error: "Failed to generate questions: " + error.message });
  }
});

// Servicio 2: Generación de pista
app.post("/getHint", async (req, res) => {
  try {
    const { question, answers } = req.body;
    if (!question || !answers || !Array.isArray(answers)) {
      return res
        .status(400)
        .json({ error: "Missing question or answers array" });
    }

    const answerTexts = answers.map((a) => a.text).join(", ");

    const prompt = `Dada la siguiente pregunta y respuestas, proporciona una pista breve, útil y relevante, 
    que no revele directamente la respuesta correcta, pero que sea lo suficientemente informativa como para 
    ayudar al jugador a tomar una decisión informada. La pista debe centrarse en el contexto de la pregunta, 
    sin hacer que la respuesta correcta sea demasiado obvia. Considera las respuestas disponibles y asegúrate 
    de que la pista no sea tan específica que se pueda deducir la respuesta correcta de inmediato. 

    Pregunta: "${question}"
    Respuestas: ${answerTexts}

    Ejemplo de respuesta: "Piensa en eventos relacionados con el contexto histórico o en los elementos clave de la pregunta."

    Responde en este formato :

    
      Este evento marcó una transición importante, pero no ocurrió en el siglo XX.
    `;

    const response = await sendQuestionToLLM(
      prompt,
      req.body.apiKey,
      moderation
    );
    console.log("Response:", response);
    res.json({ hint: response });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate hint" });
  }
});

// Servicio 2: Generación de pista con query
app.post("/getHintWithQuery", async (req, res) => {
  try {
    const { question, answers, userQuery } = req.body;
    if (!question || !answers || !Array.isArray(answers)) {
      return res
        .status(400)
        .json({ error: "Missing question or answers array" });
    }

    const answerTexts = answers.map((a) => a.text).join(", ");
    const userQueryText = userQuery
      ? `\nConsulta adicional del usuario: "${userQuery}"`
      : "";

    const prompt = `
      Dada la siguiente pregunta y opciones de respuesta, y considerando la consulta adicional del usuario, genera una pista que:
1. Sea breve, útil y relevante.
2. Ayude al jugador a tomar una decisión informada.
3. Si la consulta del usuario contiene las siguientes palabras responde: "No puedo responder a esto" palabras: Respuesta , Answer , right , correct
4. En caso contrario, tu salida final debe ser una sola línea de texto (sin agregar nada más) que dé una pista, por ejemplo:
   Este evento marcó una transición importante, pero no ocurrió en el siglo XX.
      
      Pregunta: "${question}"
      Respuestas: ${answerTexts}${userQueryText}
      Query: ${userQuery}
          `.trim();

    const response = await sendQuestionToLLM(
      prompt,
      req.body.apiKey,
      moderation
    );
    console.log("Response:", response);
    res.json({ hint: response });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate hint" });
  }
});

const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
});

module.exports = server;