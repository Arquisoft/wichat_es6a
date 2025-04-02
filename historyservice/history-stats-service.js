const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const connectDatabase = require('../llmservice/config/database');
connectDatabase(mongoose);

const User = require("../llmservice/models/stats-model.js")(mongoose);
const History = require("../llmservice/models/history-model")(mongoose);

const app = express();
const port = process.env.PORT || 8010;

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

// Route to fetch user game statistics
app.get("/stats", async (req, res) => {
  try {
    const userName = "testuser1";

    // Ensure database connection is established before checking collections
    await mongoose.connection.asPromise();
    const collections = await mongoose.connection.db.listCollections().toArray();
    const gamesCollectionExists = collections.some(col => col.name === "games");
    
    let history = [];
    if (gamesCollectionExists) {
      history = await History.find({ username: userName });
      console.log("Historial encontrado:", history);
    } else {
      console.log("La colección 'games' no existe. Usando array vacío.");
    }

    // Calculate statistics
    const wins = history.filter((game) => game.score > 50).length;
    const losses = history.length - wins;
    const totalPoints = history.reduce((acc, game) => acc + game.score, 0);
    const pointsPerGame = history.length > 0 ? totalPoints / history.length : 0;

    const bestGames = history
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((game) => ({
        id: game.gameId,
        points: game.score,
        date: game.recordedAt ? game.recordedAt.toISOString() : null,
      }));

    res.json({
      username: userName,
      gamesPlayed: history.length,
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

// Start the History Service
app.listen(port, () => {
  console.log(`History Service running on port ${port}`);
});
