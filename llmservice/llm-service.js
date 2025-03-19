const axios = require("axios");
const express = require("express");
const cors = require("cors"); // Import the cors package
const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", // Or the correct port of your React app
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
const port = 8003;
let moderation = "You are a quiz game assistant.";
require("dotenv").config(); // Cargar las variables de entorno desde .env

// URL del servicio de Wikidata (server.js)
const WIKIDATA_SERVICE_URL = "http://wikidataservice:8020/api";

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
    const config = llmConfigs["empathy"];
    if (!config) {
      throw new Error(`Model is not supported.`);
    }

    const url = config.url();
    const requestData = config.transformRequest(question, moderation);
    const headers = config.headers(apiKey);

    const response = await axios.post(url, requestData, { headers });

    return config.transformResponse(response);
  } catch (error) {
    console.error(`Error sending question:`, error.message || error);
    return "Error processing request.";
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

    const { question, apiKey } = req.body; // La apiKey ya ha sido añadida automáticamente
    const answer = await sendQuestionToLLM(question, apiKey, moderation);

    res.json({ answer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Servicio 1: Generación de preguntas y respuestas a partir del contexto
app.post("/generateQuestions", async (req, res) => {
  try {
    if (!req.body.context) {
      return res.status(400).json({ error: "Missing context" });
    }
    // Lista de categorías y sus endpoints en server.js
    const categories = [
      { name: "paises", endpoint: "/paises" },
      { name: "monumentos", endpoint: "/monumentos" },
      { name: "elementos", endpoint: "/elementos" },
      { name: "peliculas", endpoint: "/peliculas" },
      { name: "canciones", endpoint: "/canciones" },
      { name: "formula1", endpoint: "/formula1" },
      { name: "pinturas", endpoint: "/pinturas" },
    ];

    // Función para seleccionar una categoría aleatoria
    function getRandomCategory() {
      return categories[Math.floor(Math.random() * categories.length)];
    }

    const randomCategory = getRandomCategory(); // Selecciona una categoría aleatoria
    const apiUrl = `${WIKIDATA_SERVICE_URL}${randomCategory.endpoint}`;

    // Solicitar datos al servicio de Wikidata
    const { data } = await axios.get(apiUrl);
    // Seleccionar una entrada aleatoria de los datos obtenidos
    console.log("Data:", data);
    const entry = data[Math.floor(Math.random() * data.length)];
    let informacion = "";

    if (!data || data.length === 0) {
      return res.status(500).json({ error: "No data found from Wikidata" });
    }

    switch (randomCategory.name) {
      case "paises":
        informacion = `País: ${entry.countryLabel},  Su Capital: ${entry.capitalLabel}`;
        break;
      case "monumentos":
        informacion = `Monumento: ${entry.monumentLabel}, Su País: ${entry.countryLabel}`;
        break;
      case "elementos":
        informacion = `Elemento: ${entry.elementLabel}, Su Símbolo: ${entry.symbol}`;
        break;
      case "peliculas":
        informacion = `Película: ${entry.peliculaLabel}, Su Director: ${entry.directorLabel}`;
        break;
      case "canciones":
        informacion = `Canción: ${entry.songLabel}, Su Artista: ${entry.artistLabel}`;
        break;
      case "formula1":
        informacion = `Campeonato de formula 1 año: ${entry.year}, Ganador: ${entry.winnerLabel}`;
        break;
      case "pinturas":
        informacion = `Pintura: ${entry.paintingLabel}, Su Autor: ${entry.artistLabel}`;
        break;
    }
    const context = req.body.context;
    console.log("Informacion: ", informacion);
    const prompt = `A partir del siguiente texto: "${informacion}", genera 4 preguntas de opción múltiple. 
    Cada pregunta debe tener 4 respuestas, una correcta y tres incorrectas. Si tiene un codigo buscalo en wikidata.
    Ten en cuenta que el jugador no tiene acceso al nombre del monumento, pelicula, cancion, etc. Por lo que deberas
    mencionarlo en las preguntas:

    Texto: "${context}"

    Responde en formato JSON, la respuesta debe incluir UNICAMENTE el formato JSON con las preguntas y respuestas:
    {
      "questions": [
        {
          "question": "Pregunta 1",
          "answers": [
            { "text": "Respuesta correcta", "correct": true },
            { "text": "Respuesta incorrecta 1", "correct": false },
            { "text": "Respuesta incorrecta 2", "correct": false },
            { "text": "Respuesta incorrecta 3", "correct": false }
          ]
        },
        ...
      ]
    }
      
    Responde unicamente con el JSON`;

    const response = await sendQuestionToLLM(
      prompt,
      req.body.apiKey,
      moderation
    );
    console.log("Response:", response);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate questions" });
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
