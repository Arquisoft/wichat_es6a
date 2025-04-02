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

    console.log("Conexión a MongoDB:", mongoose.connection.readyState); // 1 = conectado, 0 = desconectado
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
      });
    }

    const wins = games.filter((game) => game.score > 50).length;
    const losses = games.length - wins;
    const totalPoints = games.reduce((acc, game) => acc + game.score, 0);
    const pointsPerGame = games.length > 0 ? totalPoints / games.length : 0;

    const bestGames = games
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((game) => ({
        id: game.gameId,
        points: game.score,
        date: game.recordedAt.toISOString(),
      }));

    res.json({
      username: username,
      gamesPlayed: games.length,
      totalPoints,
      pointsPerGame,
      wins,
      losses,
      bestGames,
    });
  } catch (error) {
    console.error("Error en /stats:", error);
    res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
});

// Iniciar el servicio de Historia
app.listen(port, () => {
  console.log(`History Service running on port ${port}`);
});