const express = require('express');
const axios = require('axios');
const cors = require('cors');
const promBundle = require('express-prom-bundle');
// Libraries required for OpenAPI-Swagger
const swaggerUi = require('swagger-ui-express'); 
const fs = require("fs")
const YAML = require('yaml');
const { Counter, Gauge } = require('prom-client');  // Importar nuevas métricas

const app = express();
const port = 8000;

const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8002';
const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8003';
const questionServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://localhost:8005';
const historyServiceUrl = process.env.HISTORY_SERVICE_URL || 'http://localhost:8010';
const wikidataServiceUrl = process.env.WIKIDATA_SERVICE_URL || 'http://localhost:8020';

app.use(cors());
app.use(express.json());

// Prometheus configuration
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  promClient: {
    collectDefaultMetrics: {},
  },
});
app.use(metricsMiddleware);

// **Nuevas métricas personalizadas**
// Contador de fallos al contactar servicios
const failedRequestsCounter = new Counter({
  name: 'gateway_failed_requests_total',
  help: 'Número de fallos al contactar servicios',
  labelNames: ['service', 'endpoint', 'status']
});

// Estado de los servicios de backend
const authServiceUp = new Gauge({
  name: 'auth_service_up',
  help: 'Estado del servicio de autenticación (1 = OK, 0 = DOWN)',
});
const llmServiceUp = new Gauge({
  name: 'llm_service_up',
  help: 'Estado del servicio LLM (1 = OK, 0 = DOWN)',
});
const userServiceUp = new Gauge({
  name: 'user_service_up',
  help: 'Estado del servicio de usuarios (1 = OK, 0 = DOWN)',
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Revisa el estado de los servicios (cada 10 segundos)
async function checkServiceHealth() {
  try {
    await axios.get(`${authServiceUrl}/health`);
    authServiceUp.set(1);
  } catch {
    authServiceUp.set(0);
  }

  try {
    await axios.get(`${llmServiceUrl}/health`);
    llmServiceUp.set(1);
  } catch {
    llmServiceUp.set(0);
  }

  try {
    await axios.get(`${userServiceUrl}/health`);
    userServiceUp.set(1);
  } catch {
    userServiceUp.set(0);
  }
}
setInterval(checkServiceHealth, 10000); // Cada 10 segundos
// Endpoints de la aplicación

/* ENDPOINTS DEL SERVICIO DE USUARIOS */

app.get('/user/:id', async (req, res) => {
  try {
    const userResponse = await axios.get(userServiceUrl + `/user/${req.params.id}`);
    res.json(userResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'user', endpoint: '/user/:id', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.put('/user/:id/username', async (req, res) => {
  try {
    const userResponse = await axios.put(userServiceUrl + `/user/${req.params.id}/username`, req.body);
    res.json(userResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'user', endpoint: '/user/:id/username', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.put('/user/:id/password', async (req, res) => {
  try {
    const userResponse = await axios.put(userServiceUrl + `/user/${req.params.id}/password`, req.body);
    res.json(userResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'user', endpoint: '/user/:id/password', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.post('/user/:id/profile-pic', async (req, res) => {
  try {
    const userResponse = await axios.post(userServiceUrl + `/user/${req.params.id}/profile-pic`, req.body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    res.json(userResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'user', endpoint: '/user/:id/profile-pic', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/user/:id/profile-pic', async (req, res) => {
  try {
    const userResponse = await axios.get(userServiceUrl + `/user/${req.params.id}/profile-pic`, { responseType: 'stream' });
    userResponse.data.pipe(res);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'user', endpoint: '/user/:id/profile-pic', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.delete('/user/:id/profile-pic', async (req, res) => {
  try {
    const userResponse = await axios.delete(userServiceUrl + `/user/${req.params.id}/profile-pic`);
    res.json(userResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'user', endpoint: '/user/:id/profile-pic', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.post('/adduser', async (req, res) => {
  try {
    const userResponse = await axios.post(userServiceUrl + '/adduser', req.body);
    res.json(userResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'user', endpoint: '/adduser', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

/* ENDPOINTS DEL SERVICIO DE AUTENTIFICACIÓN */

app.post('/login', async (req, res) => {
  try {
    const authResponse = await axios.post(authServiceUrl + '/login', req.body);
    res.json(authResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'auth', endpoint: '/login', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

/* ENDPOINTS DEL SERVICIO DE LLM */

app.post('/generateQuestions', async (req, res) => {
  try {
    const llmResponse = await axios.post(llmServiceUrl + '/generateQuestions', req.body);
    res.json(llmResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'llm', endpoint: '/generateQuestions', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.post('/configureAssistant', async (req, res) => {
  try {
    const llmResponse = await axios.post(llmServiceUrl + '/configureAssistant', req.body);
    res.json(llmResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'llm', endpoint: '/configureAssistant', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.post('/ask', async (req, res) => {
  try {
    const llmResponse = await axios.post(llmServiceUrl + '/ask', req.body);
    res.json(llmResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'llm', endpoint: '/ask', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.post('/getHint', async (req, res) => {
  try {
    const llmResponse = await axios.post(llmServiceUrl + '/getHint', req.body);
    res.json(llmResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'llm', endpoint: '/getHint', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.post('/getHintWithQuery', async (req, res) => {
  try {
    const llmResponse = await axios.post(llmServiceUrl + '/getHintWithQuery', req.body);
    res.json(llmResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'llm', endpoint: '/getHintWithQuery', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

// Nuevo endpoint para generar preguntas
app.post('/generateQuestions', async (req, res) => {
  try {
    const questionResponse = await axios.post(`${llmServiceUrl}/generateQuestions`, req.body);
    res.json(questionResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'llm', endpoint: '/generateQuestions', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
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

// Start the gateway service
const server = app.listen(port, () => {
  console.log(`Gateway Service listening at http://localhost:${port}`);
});

module.exports = server;
