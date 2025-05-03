const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const swaggerUi = require('swagger-ui-express'); 
const fs = require("fs")
const YAML = require('yaml');

const isTest = process.env.NODE_ENV === "test";

const MONGO_URI = isTest
  ? "mongodb://localhost:27017/testdb"
  : process.env.MONGO_URI || "mongodb://mongodb-wichat_es6a:27017/wichatdb";

mongoose.connect(MONGO_URI)
  .then(() => console.log(`Conectado a MongoDB en ${MONGO_URI}`))
  .catch(err => console.error("Error en la conexión a MongoDB:", err.message));

  
let UserGame;

UserGame = require("./models/history-model")(mongoose); 

const app = express();
const port = process.env.PORT || 8010;

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:8000",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization,username"
}));

// Helper function to normalize difficulty
const normalizeDifficulty = (diff) => {
  if (!diff) return "Not set";
  const map = {
    'fácil': 'Fácil',
    'medio': 'Medio',
    'difícil': 'Difícil',
    'Fácil': 'Fácil',
    'Medio': 'Medio',
    'Difícil': 'Difícil'
  };
  return map[diff.toLowerCase()] || diff;
};

// Helper function to map games to response format
const mapGamesToResponse = (games) => {
  return games.map((game) => ({
    id: game.gameId,
    points: game.score,
    date: game.recordedAt.toISOString(),
    category: game.category || "Sin categoría",
    timeTaken: game.timeTaken || 0,
    totalQuestions: game.totalQuestions || 0,
    correctQuestions: game.correctQuestions || 0,
    difficulty: normalizeDifficulty(game.difficulty)
  }));
};

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Endpoint to get the top 3 best games
app.get("/getBestGames", async (req, res) => {
  try {
    const username = req.headers.username;
    console.log("Username recibido en /getBestGames:", username);

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const games = await UserGame.find({ username });
    console.log("Partidas encontradas en /getBestGames:", games.length);

    if (!games || games.length === 0) {
      return res.json([]);
    }

    const bestGames = games
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    res.json(mapGamesToResponse(bestGames));
  } catch (error) {
    console.error("Error en /getBestGames:", error);
    res.status(500).json({ message: "Error fetching best games", error: error.message });
  }
});

// Endpoint to get all games
app.get("/getAllGames", async (req, res) => {
  try {
    const username = req.headers.username;
    console.log("Username recibido en /getAllGames:", username);

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const games = await UserGame.find({ username });
    console.log("Partidas encontradas en /getAllGames:", games.length);

    if (!games || games.length === 0) {
      return res.json([]);
    }

    const allGames = games.sort((a, b) => b.score - a.score);

    res.json(mapGamesToResponse(allGames));
  } catch (error) {
    console.error("Error en /getAllGames:", error);
    res.status(500).json({ message: "Error fetching all games", error: error.message });
  }
});

// Refactored /stats endpoint
app.get("/stats", async (req, res) => {
  try {
    console.log("Servicio iniciado:");
    const username = req.headers.username;
    console.log("Username recibido:", username);

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    console.log("Conexión a MongoDB:", mongoose.connection.readyState);
    const games = await UserGame.find({ username });
    console.log("Partidas encontradas:", games);

    if (!games || games.length === 0) {
      return res.json({
        username: username,
        gamesPlayed: 0,
        totalPoints: 0,
        pointsPerGame: 0,
        wins: 0,
        losses: 0,
        bestGames: [],
        mostPlayedCategory: "Sin categoría",
        averageGameTime: 0,
        difficulty: "Not set",
      });
    }

    // Calcular estadísticas existentes
    const wins = games.filter((game) => game.correctQuestions >= game.totalQuestions / 2).length;
    const losses = games.length - wins;
    const totalPoints = games.reduce((acc, game) => acc + game.score, 0);
    const pointsPerGame = games.length > 0 ? totalPoints / games.length : 0;

    // Calcular la categoría más jugada
    const categoryCounts = games.reduce((acc, game) => {
      const category = game.category || "Sin categoría";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Calcular el tiempo medio de partida
    const totalTime = games.reduce((acc, game) => acc + (game.timeTaken || 0), 0);
    const averageGameTime = games.length > 0 ? totalTime / games.length : 0;

    // Get best games using the same logic as /getBestGames
    const bestGames = games
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    res.json({
      username: username,
      gamesPlayed: games.length,
      totalPoints,
      pointsPerGame,
      wins,
      losses,
      bestGames: mapGamesToResponse(bestGames),
      averageGameTime,
    });
  } catch (error) {
    console.error("Error en /stats:", error);
    res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
});

app.post("/addGame", async (req, res) => {
  try {
    const { username, score, correctQuestions, gameId, category, timeTaken, totalQuestions, difficulty } = req.body;

    console.log("Datos recibidos:", req.body);

    // Validación de campos obligatorios
    const requiredFields = {
      'username': { type: 'string', message: 'Username must be a string' },
      'score': { type: 'number', message: 'Score must be a number' },
      'correctQuestions': { type: 'number', message: 'CorrectQuestions must be a number' },
      'gameId': { type: 'string', message: 'GameId must be a string' },
      'totalQuestions': { type: 'number', message: 'TotalQuestions must be a number' },
      'difficulty': { type: 'string', message: 'Difficulty must be a name' }
    };

    const errors = [];

    // Verificar campos obligatorios
    for (const [field, validation] of Object.entries(requiredFields)) {
      if (!req.body[field]) {
        errors.push(`${field} is required`);
      } else if (typeof req.body[field] !== validation.type) {
        errors.push(validation.message);
      }
    }

    // Validaciones numéricas
    if (score !== undefined && score < 0) errors.push("Score cannot be negative");
    if (correctQuestions !== undefined && correctQuestions < 0) errors.push("CorrectQuestions cannot be negative");
    if (timeTaken !== undefined && timeTaken < 0) errors.push("TimeTaken cannot be negative");
    if (totalQuestions !== undefined && totalQuestions < 0) errors.push("totalQuestions cannot be negative");
    if (difficulty == undefined ) errors.push("Not a valid difficulty");

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors
      });
    }

    // Crear nueva partida
    const newGame = new UserGame({
      username,
      score: Math.floor(score),
      correctQuestions: Math.floor(correctQuestions),
      gameId,
      category: category || null,
      timeTaken: timeTaken ? Math.floor(timeTaken) : null,
      totalQuestions: totalQuestions || null,
      difficulty: normalizeDifficulty(difficulty)
    });

    const savedGame = await newGame.save();

    // Formatear respuesta
    const responseGame = {
      username: savedGame.username,
      score: savedGame.score,
      correctQuestions: savedGame.correctQuestions,
      gameId: savedGame.gameId,
      recordedAt: savedGame.recordedAt,
      category: savedGame.category,
      timeTaken: savedGame.timeTaken,
      totalQuestions: savedGame.totalQuestions,
      difficulty: savedGame.difficulty,
    };

    res.status(201).json({
      message: "Game successfully added",
      game: responseGame
    });

  } catch (error) {
    console.error("Error in /addGame:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
});

// PUT /update-username
app.put('/update-username', async (req, res) => {
  const { actualUserName, newUsername } = req.body;

  if (!actualUserName || !newUsername) {
    return res.status(400).json({ error: 'Both actualUserName and newUsername are required' });
  }

  try {
    await UserGame.updateMany( //NOSONAR
      { username: actualUserName },
      { $set: { username: newUsername } }
    );

    res.json({
      message: 'Username updated in user games successfully',
    });
  } catch (error) {
    console.error('Error updating username in history:', error);
    res.status(500).json({ error: 'Internal server error' });
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


// Exportar el objeto app para las pruebas
module.exports = app;

// Iniciar el servidor solo si el archivo se ejecuta directamente
if (require.main === module) {
  app.listen(port, () => {
    console.log(`History Service running on port ${port}`);
  });
}

