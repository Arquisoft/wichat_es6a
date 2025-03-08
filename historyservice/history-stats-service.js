const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const History = require('./history-model');
const User = require('./user-model');

const app = express();
const port = process.env.PORT || 8010;

// Middleware to parse JSON in request body
app.use(express.json());

// Middleware to enable CORS
app.use(cors());

// Connect to MongoDB
const mongoUri = 'mongodb://mongodb-wichat_es6a:27017/gameStats';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Route for player statistics
app.get("/stats", async (req, res) => {
  try {
    const userName = "testuser1";
    const user = await User.findOne({ username: userName });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const history = user.games;
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
        date: game.recordedAt.toISOString(),
      }));

    res.json({
      username: user.username,
      password: user.password,
      gamesPlayed: history.length,
      totalPoints,
      pointsPerGame,
      wins,
      losses,
      bestGames,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Error fetching stats" });
  }
});

// Start the server
const server = app.listen(port, () => {
  console.log(`History Stats Service listening at http://localhost:${port}`);
});

// Handle server close event
server.on('close', () => {
  mongoose.connection.close();
});

module.exports = server;