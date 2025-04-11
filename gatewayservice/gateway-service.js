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

const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8003';
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8002';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';

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

// Endpoints de tu aplicación

app.post('/login', async (req, res) => {
  try {
    const authResponse = await axios.post(authServiceUrl + '/login', req.body);
    res.json(authResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'auth', endpoint: '/login', status: error.response?.status || 500 });
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

app.post('/askllm', async (req, res) => {
  try {
    const llmResponse = await axios.post(llmServiceUrl + '/ask', req.body);
    res.json(llmResponse.data);
  } catch (error) {
    failedRequestsCounter.inc({ service: 'llm', endpoint: '/askllm', status: error.response?.status || 500 });
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "Internal Server Error" });
  }
});

// Nuevo endpoint para generar preguntas
app.post('/generateQuestions', async (req, res) => {
  try {
    const questionResponse = await axios.post(`${llmServiceUrl}/generateQuestions`, req.body);
    res.json(questionResponse.data);
  } catch (error) {
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
