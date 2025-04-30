require("dotenv").config();
const request = require("supertest");
const axios = require("axios");
const { app, server } = require("./llm-service");

jest.mock("axios");

// Mock de fetch global
global.fetch = jest.fn();

// Configurar la respuesta mock para fetch`
fetch.mockResolvedValue({
  json: jest.fn().mockResolvedValue({
    success: true,
    message: "Pregunta agregada con éxito"
  }),
});

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
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  "question": "¿Cuál es la capital de Francia?",
                  "answers": [
                    { "text": "París", "isCorrect": true },
                    { "text": "Madrid", "isCorrect": false },
                    { "text": "Roma", "isCorrect": false },
                    { "text": "Berlín", "isCorrect": false }
                  ]
                })
              }]
            }
          }]
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
    expect(response.body.answer).toBe("{\"question\":\"¿Cuál es la capital de Francia?\",\"answers\":[{\"text\":\"París\",\"isCorrect\":true},{\"text\":\"Madrid\",\"isCorrect\":false},{\"text\":\"Roma\",\"isCorrect\":false},{\"text\":\"Berlín\",\"isCorrect\":false}]}");
  });

  it("should generate questions based on context", async () => {
      // Configuramos lo que `fetch` debería devolver cuando se hace la llamada
      fetch.mockResolvedValue({
        ok: true,  // Simula que la respuesta HTTP fue exitosa
        json: jest.fn().mockResolvedValue({ success: true, message: "Pregunta agregada" }),
      });

      // Realizamos la llamada POST a tu endpoint
      const apiKey = "your_api_key";  // Asegúrate de tener una clave de API válida para este test
      const response = await request(app)
        .post("/generateQuestions")
        .send({ context: "Historia de los países", apiKey });

      // Aseguramos que la respuesta del endpoint sea la esperada
      expect(response.statusCode).toBe(200);

      // Verificamos que `fetch` haya sido llamado con la URL y los datos correctos
      expect(fetch).toHaveBeenCalledWith(
        "http://gatewayservice:8000/addQuestion",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.any(String),  // Verificamos que se haya pasado un cuerpo válido
        })
      );
    }, 10000); // 10 segundos de timeout para el test

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

  /** Actualmente todos los parametros tienen valores predefinidos osea que queda invalidado este caso
  it("should return 400 when required fields are missing in /generateQuestions", async () => {
    const response = await request(app)
      .post("/generateQuestions")
      .send({ apiKey });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Failed to generate questions");
  });
  */

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
