const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Question = require('./question-model');
const User = require('./user-model');

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

const server = app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});

// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });
