// question-history-service.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

let Questions;

try {
  const connectDatabase = require("/usr/src/llmservice/config/database");
  connectDatabase(mongoose);
  Questions = require("/usr/src/llmservice/models/questions-model")(mongoose);
} catch (error) {
  const connectDatabase = require("../../llmservice/config/database");
  connectDatabase(mongoose);
  Questions = require("../../llmservice/models/questions-model")(mongoose);
}

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization,username",
  })
);

app.post("/addQuestion", async (req, res) => {
  try {
    const { question, correctAnswer, incorrectAnswers, category } = req.body;

    if (
      !question ||
      typeof question !== "string" ||
      !correctAnswer ||
      typeof correctAnswer !== "string" ||
      !Array.isArray(incorrectAnswers) ||
      !incorrectAnswers.every((ans) => typeof ans === "string") ||
      typeof category !== "string"
    ) {
      return res.status(400).json({
        error:
          "Invalid format. Required: question (string), correctAnswer (string), incorrectAnswers (array of 3 strings), category (string).",
      });
    }
    
    const questions = await Questions.find();

    const exists = questions.some(
        (q) => q.question.trim().toLowerCase() === question.trim().toLowerCase()
    );

    if (exists) {
      console.log("Skipped duplicate question:", question);
      return res.status(200).json({
        message: "Question already exists. Skipped insertion.",
      });
    }

    const newQuestion = {
      question: question.trim(),
      correctAnswer: correctAnswer.trim(),
      incorrectAnswers: incorrectAnswers.map((ans) => ans.trim()),
      category: category.trim(),
    };

    await Questions.create(newQuestion);
    res.status(201).json({ message: "Question saved successfully." });
  } catch (error) {
    console.error("Error while saving question:", error);
    res
      .status(500)
      .json({ error: "Internal server error while saving question." });
  }
});

app.get("/questions", async (req, res) => {
  try {
    const questions = await Questions.find();
    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Error fetching questions" });
  }
});

module.exports = { app, mongoose };


     