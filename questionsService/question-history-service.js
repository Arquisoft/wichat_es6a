// question-history-service.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");


const isTest = process.env.NODE_ENV === "test";

const MONGO_URI = isTest
  ? "mongodb://localhost:27017/testdb"
  : process.env.MONGO_URI || "mongodb://mongodb-wichat_es6a:27017/wichatdb";

mongoose.connect(MONGO_URI)
  .then(() => console.log(`Conectado a MongoDB en ${MONGO_URI}`))
  .catch(err => console.error("Error en la conexión a MongoDB:", err.message));


let Questions;
Questions = require("./models/questions-model")(mongoose);


const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const YAML = require("yaml");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization,username",
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.post("/addQuestion", async (req, res) => {
  try {
    const { question, correctAnswer, incorrectAnswers, category, imageUrl } =
      req.body;

    if (
      !question ||
      typeof question !== "string" ||
      !correctAnswer ||
      typeof correctAnswer !== "string" ||
      !Array.isArray(incorrectAnswers) ||
      !incorrectAnswers.every((ans) => typeof ans === "string") ||
      typeof category !== "string" ||
      (imageUrl && typeof imageUrl !== "string")
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
      imageUrl: imageUrl ? imageUrl.trim() : null, // <-- Añadido
    };

    await Questions.create(newQuestion); // NOSONAR
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
    const category = req.query.category;
    let filter = {};
    if (category && category.toLowerCase() !== "variado") {
      filter = { category: new RegExp(`^${category}$`, "i") }; //NOSONAR
      console.log(`Filtrando preguntas por categoría: ${category}`);
    } else {
      console.log(
        "Obteniendo preguntas de todas las categorías (Variado o sin filtro)."
      );
    }

    const questions = await Questions.find(filter);

    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Error fetching questions" });
  }
});

// **Configuración de Swagger**
let openapiPath = './openapi.yaml'
if (fs.existsSync(openapiPath)) {
  const file = fs.readFileSync(openapiPath, "utf8");
  const swaggerDocument = YAML.parse(file);
  app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.log("Not configuring OpenAPI. Configuration file not present.");
}

module.exports = { app, mongoose };
