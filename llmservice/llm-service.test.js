require("dotenv").config();
const request = require("supertest");
const axios = require("axios");
const { app, server } = require("./llm-service");

jest.mock("axios");

// Cerrar servidor después de todos los tests
afterAll(async () => {
  if (server && server.close) {
    server.close();
  }
});

describe("LLM Service", () => {
  // Mock de respuestas del servicio LLM
  axios.post.mockImplementation((url, data) => {
    if (url.startsWith("https://empathyai")) {
      return Promise.resolve({
        data: {
          choices: [{ message: { content: "llmanswer" } }],
        },
      });
    } else if (url.startsWith("https://generativelanguage.googleapis.com")) {
      return Promise.resolve({
        data: {
          candidates: [{ content: { parts: [{ text: "geminianswer" }] } }],
        },
      });
    } else {
      return Promise.reject(new Error("Unknown provider"));
    }
  });

  axios.get.mockImplementation(() =>
    Promise.resolve({
      data: [
        { countryLabel: "Francia", capitalLabel: "París" },
        { countryLabel: "España", capitalLabel: "Madrid" },
      ],
    })
  );

  const apiKey = process.env.LLM_API_KEY;

  it("should return an answer from LLM", async () => {
    const response = await request(app)
      .post("/ask")
      .send({ question: "a question", apiKey });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe("geminianswer");
  });

  it("should generate questions based on context", async () => {
    const response = await request(app)
      .post("/generateQuestions")
      .send({ context: "Historia de los países", apiKey });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("geminianswer");
  });

  it("should return a hint for a question", async () => {
    const response = await request(app).post("/getHint").send({
      question: "¿Cuál es la capital de Francia?",
      answers: [
        { text: "París", correct: true },
        { text: "Madrid", correct: false },
        { text: "Berlín", correct: false },
        { text: "Roma", correct: false },
      ],
      apiKey,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.hint).toBeDefined();
  });

  it("should return a hint with a user query", async () => {
    const response = await request(app).post("/getHintWithQuery").send({
      question: "¿Cuál es la capital de Francia?",
      answers: [
        { text: "París", correct: true },
        { text: "Madrid", correct: false },
        { text: "Berlín", correct: false },
        { text: "Roma", correct: false },
      ],
      userQuery: "Dame una pista sobre la geografía de Europa",
      apiKey,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.hint).toBeDefined();
  });

  it("should return 400 when required fields are missing in /ask", async () => {
    const response = await request(app).post("/ask").send({ apiKey });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Failed to get answer: Missing or invalid required field: question"
    );
  });

  it("should return 400 when required fields are missing in /generateQuestions", async () => {
    const response = await request(app)
      .post("/generateQuestions")
      .send({ apiKey });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Failed to generate questions");
  });

  it("should return 500 when external API fails in /generateQuestions", async () => {
    axios.get.mockImplementationOnce(() =>
      Promise.reject(new Error("External API error"))
    );

    const response = await request(app).post("/generateQuestions").send({
      context: "Historia de los países",
      apiKey,
    });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe(
      "LLM_ERROR: Failed to process request - External API error"
    );
  });

  it("should return 500 when external API fails in /ask", async () => {
    axios.post.mockImplementationOnce(() =>
      Promise.reject(new Error("External API error"))
    );

    const response = await request(app)
      .post("/ask")
      .send({ question: "a question", apiKey });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe(
      "LLM_ERROR: Failed to process request - External API error"
    );
  });

  it("should return 500 when external API fails in /getHint", async () => {
    axios.post.mockImplementationOnce(() =>
      Promise.reject(new Error("External API error"))
    );

    const response = await request(app).post("/getHint").send({
      question: "¿Cuál es la capital de Francia?",
      answers: [
        { text: "París", correct: true },
        { text: "Madrid", correct: false },
        { text: "Berlín", correct: false },
        { text: "Roma", correct: false },
      ],
      apiKey,
    });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe(
      "LLM_ERROR: Failed to process request - External API error"
    );
  });
});
