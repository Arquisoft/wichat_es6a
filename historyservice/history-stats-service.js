const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const connectDatabase = require("/usr/src/llmservice/config/database.js");
connectDatabase(mongoose);

const UserGame = require("/usr/src/llmservice/models/history-model")(mongoose);

const app = express();
const port = process.env.PORT || 8010;

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization,username"
}));

// Ruta para obtener estadísticas de usuario
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
    const mostPlayedCategory = Object.keys(categoryCounts).reduce((a, b) =>
      categoryCounts[a] > categoryCounts[b] ? a : b
    );

    // Calcular el tiempo medio de partida
    const totalTime = games.reduce((acc, game) => acc + (game.timeTaken || 0), 0); 
    const averageGameTime = games.length > 0 ? totalTime / games.length : 0;

    const bestGames = games
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((game) => ({
        id: game.gameId,
        points: game.score,
        date: game.recordedAt.toISOString(),
        category: game.category || "Sin categoría",
        timeTaken: game.timeTaken || 0, 
        totalQuestions: game.totalQuestions || 0,
        correctQuestions: game.correctQuestions || 0,
      }));

    res.json({
      username: username,
      gamesPlayed: games.length,
      totalPoints,
      pointsPerGame,
      wins,
      losses,
      bestGames,
      mostPlayedCategory,
      averageGameTime,
    });
  } catch (error) {
    console.error("Error en /stats:", error);
    res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
});

app.post("/addGame", async (req, res) => {
  try {
    const { username, score, correctQuestions, gameId, category, timeTaken, totalQuestions } = req.body;

    // Validación de campos obligatorios
    const requiredFields = {
      'username': { type: 'string', message: 'Username must be a string' },
      'score': { type: 'number', message: 'Score must be a number' },
      'correctQuestions': { type: 'number', message: 'CorrectQuestions must be a number' },
      'gameId': { type: 'string', message: 'GameId must be a string' },
      'totalQuestions': { type: 'number', message: 'TotalQuestions must be a number' }
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
      category: category || null, // Si no se proporciona, se guarda como null
      timeTaken: timeTaken ? Math.floor(timeTaken) : null, // Si no se proporciona, se guarda como null
      totalQuestions: totalQuestions || null // Si no se proporciona, se guarda como 0
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
      totalQuestions: savedGame.totalQuestions
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

// Iniciar el servicio de Historia
app.listen(port, () => {
  console.log(`History Service running on port ${port}`);
});