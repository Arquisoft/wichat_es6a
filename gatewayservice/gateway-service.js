const express = require('express');
const axios = require('axios');
const cors = require('cors');
const promBundle = require('express-prom-bundle');
const swaggerUi = require('swagger-ui-express'); 
const fs = require("fs");
const YAML = require('yaml');
const { Counter, Gauge } = require('prom-client');

const app = express();
const port = 8000;

const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8002';
const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8003';
const historyServiceUrl = process.env.HISTORY_SERVICE_URL || 'http://localhost:8010';
const questionServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://localhost:8005';
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

// Custom metrics
const failedRequestsCounter = new Counter({
  name: 'gateway_failed_requests_total',
  help: 'Número de fallos al contactar servicios',
  labelNames: ['service', 'endpoint', 'status']
});

// Service status gauges
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
const historyServiceUp = new Gauge({
  name: 'history_service_up',
  help: 'Estado del servicio de historial (1 = OK, 0 = DOWN)',
});
const questionServiceUp = new Gauge({
  name: 'question_service_up',
  help: 'Estado del servicio de preguntas (1 = OK, 0 = DOWN)',
});
const wikidataServiceUp = new Gauge({
  name: 'wikidata_service_up',
  help: 'Estado del servicio de Wikidata (1 = OK, 0 = DOWN)',
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Check the status of all services (every 10 seconds)
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

  try {
    await axios.get(`${historyServiceUrl}/health`);
    historyServiceUp.set(1);
  } catch {
    historyServiceUp.set(0);
  }

  try {
    await axios.get(`${questionServiceUrl}/health`);
    questionServiceUp.set(1);
  } catch {
    questionServiceUp.set(0);
  }

  try {
    await axios.get(`${wikidataServiceUrl}/health`);
    wikidataServiceUp.set(1);
  } catch {
    wikidataServiceUp.set(0);
  }
}

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

/* ENDPOINTS DEL SERVICIO DE HISTORIAL DE PARTIDAS */

app.get('/getBestGames', async (req, res) => {
  console.log("Username recibido en /getBestGames:", req.headers.username);
  try {
    const historyResponse = await axios.get(historyServiceUrl + '/getBestGames', {
      headers: { username: req.headers.username, "Content-Type": "application/json", }
    });
    res.json(historyResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'history', endpoint: '/getBestGames', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/getAllGames', async (req, res) => {
  console.log("Username recibido en /getAllGames:", req.headers.username);
  try {
    const historyResponse = await axios.get(historyServiceUrl + '/getAllGames', {
      headers: { username: req.headers.username, "Content-Type": "application/json", }
    });
    res.json(historyResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'history', endpoint: '/getAllGames', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/stats', async (req, res) => {
  console.log("Username recibido en /stats:", req.headers.username);
  try {
    const historyResponse = await axios.get(historyServiceUrl + '/stats', {
      headers: { username: req.headers.username, "Content-Type": "application/json", }
    });
    res.json(historyResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'history', endpoint: '/stats', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.post('/addGame', async (req, res) => {
  console.log("Username recibido en /addGame:", req.headers.username);
  try {
    const historyResponse = await axios.post(historyServiceUrl + '/addGame',
       req.body, {
        headers: {"Content-Type": "application/json",}});
    res.status(201).json(historyResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'history', endpoint: '/addGame', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});


/* ENDPOINTS DEL SERVICIO DE PREGUNTAS */

app.post('/addQuestion', async (req, res) => {
  try {
    const questionResponse = await axios.post(questionServiceUrl + '/addQuestion', req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.status(questionResponse.status).json(questionResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'question', endpoint: '/addQuestion', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/questions', async (req, res) => {
  try {
    const questionResponse = await axios.get(questionServiceUrl + '/questions');
    res.json(questionResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'question', endpoint: '/questions', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

/* ENDPOINTS DEL SERVICIO DE WIKIDATA */

app.get('/api/entries/random', async (req, res) => {
  try {
    const wikiResponse = await axios.get(wikidataServiceUrl + '/api/entries/random');
    res.json(wikiResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'wikidata', endpoint: '/api/entries/random', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/api/entries/:category', async (req, res) => {
  try {
    const wikiResponse = await axios.get(wikidataServiceUrl + `/api/entries/${req.params.category}`, {
      params: req.query
    });
    res.json(wikiResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'wikidata', endpoint: '/api/entries/:category', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.post('/api/entries/fetch/:category', async (req, res) => {
  try {
    const wikiResponse = await axios.post(wikidataServiceUrl + `/api/entries/fetch/${req.params.category}`, req.body, {
      params: req.query
    });
    res.json(wikiResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'wikidata', endpoint: '/api/entries/fetch/:category', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/api/paises', async (req, res) => {
  try {
    const wikiResponse = await axios.get(wikidataServiceUrl + '/api/paises');
    res.json(wikiResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'wikidata', endpoint: '/api/paises', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/api/monumentos', async (req, res) => {
  try {
    const wikiResponse = await axios.get(wikidataServiceUrl + '/api/monumentos');
    res.json(wikiResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'wikidata', endpoint: '/api/monumentos', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/api/elementos', async (req, res) => {
  try {
    const wikiResponse = await axios.get(wikidataServiceUrl + '/api/elementos');
    res.json(wikiResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'wikidata', endpoint: '/api/elementos', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/api/peliculas', async (req, res) => {
  try {
    const wikiResponse = await axios.get(wikidataServiceUrl + '/api/peliculas');
    res.json(wikiResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'wikidata', endpoint: '/api/peliculas', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/api/canciones', async (req, res) => {
  try {
    const wikiResponse = await axios.get(wikidataServiceUrl + '/api/canciones');
    res.json(wikiResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'wikidata', endpoint: '/api/canciones', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/api/formula1', async (req, res) => {
  try {
    const wikiResponse = await axios.get(wikidataServiceUrl + '/api/formula1');
    res.json(wikiResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'wikidata', endpoint: '/api/formula1', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

app.get('/api/pinturas', async (req, res) => {
  try {
    const wikiResponse = await axios.get(wikidataServiceUrl + '/api/pinturas');
    res.json(wikiResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'wikidata', endpoint: '/api/pinturas', status: error.response?.status || 500 });
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
