// wikidataservice/wikidata-service.js

const express = require("express");
const mongoose = require("mongoose");
const WikiQueries = require("./wikidataQueries");
const WikidataCacheService = require("./wikidataCacheService");
const connectDatabase = require("/usr/src/llmservice/config/database");

const swaggerUi  = require('swagger-ui-express'); 
const fs = require("fs");
const YAML   = require('yaml');

const app = express();
const port = 8020;

app.use(express.json());

// Conectar a MongoDB usando la configuración centralizada
connectDatabase(mongoose);

mongoose.connection.once("open", () => {
  // Inicializar la base de datos con entradas si es necesario
  WikidataCacheService.isDatabaseInitialized().then((initialized) => {
    if (!initialized) {

      console.log('Base de datos no inicializada, comenzando proceso de inicialización...');
      WikidataCacheService.initializeDatabase();
    } else {
      console.log('Base de datos ya inicializada con entradas de WikiData');

    }
  });
});

// Endpoint para obtener una entrada aleatoria de cualquier categoría
app.get("/api/entries/random", async (req, res) => {
  try {
    const randomEntry = await WikidataCacheService.getRandomEntry();
    if (!randomEntry) {
      return res.status(404).json({ error: "No se encontraron entradas" });
    }
    res.json(randomEntry);
  } catch (error) {
    res.status(500).json({ error: "Error al recuperar entrada aleatoria" });
    console.error(error);
  }
});

// Endpoint para obtener entradas por categoría
app.get("/api/entries/:category", async (req, res) => {
  let category;
  try {
    category = req.params.category;
    if (!category) {
      return res.status(400).json({ error: "Parámetro de categoría ausente" });
    }
    const count = parseInt(req.query.count) || 1;
    console.log(`Solicitadas ${count} entradas de categoría: ${category}`);
    const entries = await WikidataCacheService.getEntriesForCategory(
      category,
      count
    );

    if (!entries || entries.length === 0) {
      return res.status(404).json({
        error: `No se encontraron entradas para la categoría ${category}`,
      });
    }

    res.json(entries);
  } catch (error) {
    const categoryInfo = category ? ` para ${category}` : "";
    console.error(`Error al recuperar entradas${categoryInfo}:`, error);
    res.status(500).json({ error: "Error al recuperar entradas" });
  }
});

// Forzar la obtención de nuevas entradas para una categoría
app.post("/api/entries/fetch/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const count = parseInt(req.query.count) || 5;

    const entries = await WikidataCacheService.fetchAndSaveEntries(
      category,
      count
    );
    res.json({ success: true, count: entries.length });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener nuevas entradas" });
    console.error(error);
  }
});

app.get("/api/paises", async (req, res) => {
  try {
    // Intentar primero desde la caché
    const cachedEntries = await WikidataCacheService.getEntriesForCategory(
      "paises",
      10
    );
    if (cachedEntries && cachedEntries.length > 0) {
      return res.json(cachedEntries);
    }

    // Si no hay datos en caché, hacer consulta directa a WikiData
    const data = await WikiQueries.obtenerPaisYCapital();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los países" });
    console.log(error);
  }
});


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/api/monumentos', async (req, res) => {

  try {
    // Intentar primero desde la caché
    const cachedEntries = await WikidataCacheService.getEntriesForCategory(
      "monumentos",
      10
    );
    if (cachedEntries && cachedEntries.length > 0) {
      return res.json(cachedEntries);
    }

    // Si no hay datos en caché, hacer consulta directa a WikiData
    const data = await WikiQueries.obtenerMonumentoYPais();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los monumentos" });
  }
});

app.get("/api/elementos", async (req, res) => {
  try {
    // Intentar primero desde la caché
    const cachedEntries = await WikidataCacheService.getEntriesForCategory(
      "elementos",
      10
    );
    if (cachedEntries && cachedEntries.length > 0) {
      return res.json(cachedEntries);
    }

    // Si no hay datos en caché, hacer consulta directa a WikiData
    const data = await WikiQueries.obtenerSimboloQuimico();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los elementos químicos" });
  }
});

app.get("/api/peliculas", async (req, res) => {
  try {
    // Intentar primero desde la caché
    const cachedEntries = await WikidataCacheService.getEntriesForCategory(
      "peliculas",
      10
    );
    if (cachedEntries && cachedEntries.length > 0) {
      return res.json(cachedEntries);
    }

    // Si no hay datos en caché, hacer consulta directa a WikiData
    const data = await WikiQueries.obtenerPeliculaYDirector();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las películas" });
  }
});

app.get("/api/canciones", async (req, res) => {
  try {
    // Intentar primero desde la caché
    const cachedEntries = await WikidataCacheService.getEntriesForCategory(
      "canciones",
      10
    );
    if (cachedEntries && cachedEntries.length > 0) {
      return res.json(cachedEntries);
    }

    // Si no hay datos en caché, hacer consulta directa a WikiData
    const data = await WikiQueries.obtenerCancionYArtista();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las canciones" });
  }
});

app.get("/api/formula1", async (req, res) => {
  try {
    // Intentar primero desde la caché
    const cachedEntries = await WikidataCacheService.getEntriesForCategory(
      "formula1",
      10
    );
    if (cachedEntries && cachedEntries.length > 0) {
      return res.json(cachedEntries);
    }

    // Si no hay datos en caché, hacer consulta directa a WikiData
    const data = await WikiQueries.obtenerAñoYGanadorF1();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los datos de Fórmula 1" });
  }
});

app.get("/api/pinturas", async (req, res) => {
  try {
    // Intentar primero desde la caché
    const cachedEntries = await WikidataCacheService.getEntriesForCategory(
      "pinturas",
      10
    );
    if (cachedEntries && cachedEntries.length > 0) {
      return res.json(cachedEntries);
    }

    // Si no hay datos en caché, hacer consulta directa a WikiData
    const data = await WikiQueries.obtenerPintorYObras();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las pinturas" });
  }
});

// **Configuración de Swagger**
let openapiPath = './openapi.yaml'
if (fs.existsSync(openapiPath)) {
  const file = fs.readFileSync(openapiPath, 'utf8');
  const swaggerDocument = YAML.parse(file);
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.log("Not configuring OpenAPI. Configuration file not present.")
}

const server = app.listen(port, () => {
  console.log(`WikiData Service corriendo en http://localhost:${port}`);
});

module.exports = { server };
