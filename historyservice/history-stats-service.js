const express = require("express");
const cors = require("cors");

const connectDatabase = require('/usr/src/llmservice/config/database');
connectDatabase(mongoose); // Connect to MongoDB using the centralized configuration

const User = require("../llmservice/models/stats-model")(mongoose);
const History = require("../llmservice/models/history-model")(mongoose);

const app = express();
const port = process.env.PORT || 8010;

// Middleware
app.use(express.json());
app.use(cors());

// Route to fetch user game statistics
app.get("/stats", async (req, res) => {
  try {
    const userName = "testuser1";
    
    // Find the user by username
    const user = await User.findOne({ username: userName });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Retrieve the user's game history from the History collection
    const history = await History.find({ username: userName });

    // Calculate statistics
    const wins = history.filter((game) => game.score > 50).length;
    const losses = history.length - wins;
    const totalPoints = history.reduce((acc, game) => acc + game.score, 0);
    const pointsPerGame = history.length > 0 ? totalPoints / history.length : 0;

    // Get the top 3 best games based on score
    const bestGames = history
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((game) => ({
        id: game.gameId,
        points: game.score,
        date: game.recordedAt.toISOString(),
      }));

    // Send response with user statistics
    res.json({
      username: user.username,
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

// Start the History Service
app.listen(port, () => {
  console.log(`History Service running on port ${port}`);
});