const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');

const connectDatabase = require('/usr/src/llmservice/config/database');
connectDatabase(mongoose);

const User = require("/usr/src/llmservice/models/user-mode")(mongoose);
const History = require("/usr/src/llmservice/models/history-model")(mongoose);

const app = express();

app.use(express.json());
app.use(cors());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);

// Questions by user...
app.get("/user/questions", async (req, res) => {
    try {
        // Fetch user (simulated for now)
        const user = await User.findOne();
        if (!user) return res.status(404).json({ error: "User not found" });

        // Fetch all questions (simulated answered questions)
        const allQuestions = await Question.find();
        const answeredQuestions = allQuestions.map((q) => ({
            question: q.question,
            correctAnswer: q.correctAnswer,
            isCorrect: Math.random() < 0.5, // Simulated correctness
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
        const questions = await Question.find();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: "Error fetching questions" });
    }
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});

// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });
