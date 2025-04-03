const express = require("express");
const mongoose = require('mongoose');

const connectDatabase = require('/usr/src/llmservice/config/database');
connectDatabase(mongoose);

const User = require("/usr/src/llmservice/models/stats-model")(mongoose);

const app = express();

app.use(express.json());

// Questions by user...
app.get("/user/questions", async (req, res) => {
    try {
        const user = await User.findOne();
        if (!user) return res.status(404).json({ error: "User not found" });

        const allQuestions = await Question.find();
        const answeredQuestions = allQuestions.map((q) => ({
            question: q.question,
            correctAnswer: q.correctAnswer,
            isCorrect: Math.random() < 0.5,
        }));

        // Calculate stats
        const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
        const incorrectAnswers = answeredQuestions.length - correctAnswers;

        res.json({
            username: user.username,
            dni: user.dni,
            questions: answeredQuestions,
            totalQuestions: answeredQuestions.length,
            correctAnswers,
            incorrectAnswers,
        });
    } catch (error) {
        console.error("Error fetching user questions:", error);
        res.status(500).json({ error: "Error fetching user and questions" });
    }
});

app.get("/questions", async (req, res) => {
  
    try {
      const users = await UserGames.find();
      let allQuestions = [];
  
      users.forEach(user => {
        user.games.forEach(game => {
          if (game.questions) {
            allQuestions = allQuestions.concat(game.questions);
          }
        });
      });
  
      res.json(allQuestions);
    } catch (error) {
      res.status(500).json({ error: "Error fetching questions" });
    }
  });

const port = 8005;
const server = app.listen(port, () => {
  console.log(`Questions Service listening at http://localhost:${port}`);
});

// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });
