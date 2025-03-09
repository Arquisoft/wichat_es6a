const axios = require('axios');
const express = require('express');

const app = express();
const port = 8003;
let moderation = "You are a helpful assistant.";

app.use(express.json()); // Middleware para parsear JSON

const llmConfigs = {
  empathy: {
    url: () => 'https://ai-challenge.empathy.ai/v1/chat/completions',
    transformRequest: (question, moderation) => ({
      model: "qwen/Qwen2.5-Coder-7B-Instruct",
      stream: false, // No soporta stream=true con axios directamente
      messages: [
        { role: "system", content: moderation },
        { role: "user", content: question }
      ]
    }),
    transformResponse: (response) => response.data.choices?.[0]?.message?.content || "No response",
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  }
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
app.post('/configureAssistant', async (req, res) => {
  if (!req.body.moderation) {
    return res.status(400).json({ error: "Missing moderation prompt" });
  }
  moderation = req.body.moderation;
  res.json({ message: "Moderation prompt updated" });
});

// Ruta para enviar una pregunta
app.post('/ask', async (req, res) => {
  try {
    validateRequiredFields(req, ['question', 'apiKey']);

    const { question, apiKey } = req.body;
    const answer = await sendQuestionToLLM(question, apiKey, moderation);

    res.json({ answer });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Servicio 2: Generación de pista
app.post('/getHint', async (req, res) => {
  try {
    const { question, answers } = req.body;
    if (!question || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Missing question or answers array" });
    }

    const answerTexts = answers.map(a => a.text).join(", ");

    const prompt = `Dada la siguiente pregunta y respuestas, proporciona una pista breve, útil y relevante, 
    que no revele directamente la respuesta correcta, pero que sea lo suficientemente informativa como para 
    ayudar al jugador a tomar una decisión informada. La pista debe centrarse en el contexto de la pregunta, 
    sin hacer que la respuesta correcta sea demasiado obvia. Considera las respuestas disponibles y asegúrate 
    de que la pista no sea tan específica que se pueda deducir la respuesta correcta de inmediato. 

    Pregunta: "${question}"
    Respuestas: ${answerTexts}

    Ejemplo de respuesta: "Piensa en eventos relacionados con el contexto histórico o en los elementos clave de la pregunta."

    Responde en formato JSON:

    {
      "hint": "Este evento marcó una transición importante, pero no ocurrió en el siglo XX."
    }`;

    const response = await sendQuestionToLLM(prompt, req.body.apiKey, moderation);
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