const request = require("supertest");
const { app, mongoose } = require("./question-history-service");

describe("Question History Service", () => {
  describe("POST /addQuestion", () => {

    it("debería agregar una nueva pregunta correctamente", async () => {
        const newQuestion = {
            question: `¿Cuál es la capital de Francia? ${Date.now()}`,
            correctAnswer: "París",
            incorrectAnswers: ["Madrid", "Roma", "Berlín"],
            category: "geografía",
        };

      const res = await request(app)
        .post("/addQuestion")
        .send(newQuestion)
        .expect(201);

      expect(res.body.message).toBe("Question saved successfully.");
    });

    it("debería fallar si faltan campos obligatorios", async () => {
      const badQuestion = {
        question: "¿Cuál es la capital de Alemania?",
        correctAnswer: "Berlín",
        incorrectAnswers: ["Madrid", "Roma"], // Falta una
      };

      const res = await request(app).post("/addQuestion").send(badQuestion).expect(400);

      expect(res.body.error).toMatch(/Invalid format/);
    });

    it("debería rechazar si 'question' no es un string", async () => {
        const res = await request(app).post("/addQuestion").send({
          question: 12345,
          correctAnswer: "París",
          incorrectAnswers: ["Madrid", "Roma", "Berlín"],
          category: "geografía",
        }).expect(400);
  
        expect(res.body.error).toMatch(/Invalid format/);
      });
  
      it("debería rechazar si 'correctAnswer' no es un string", async () => {
        const res = await request(app).post("/addQuestion").send({
          question: "¿Cuál es la capital de Francia?",
          correctAnswer: 42,
          incorrectAnswers: ["Madrid", "Roma", "Berlín"],
          category: "geografía",
        }).expect(400);
  
        expect(res.body.error).toMatch(/Invalid format/);
      });
  
      it("debería rechazar si 'incorrectAnswers' no es un array", async () => {
        const res = await request(app).post("/addQuestion").send({
          question: "¿Cuál es la capital de Francia?",
          correctAnswer: "París",
          incorrectAnswers: "Madrid, Roma, Berlín",
          category: "geografía",
        }).expect(400);
  
        expect(res.body.error).toMatch(/Invalid format/);
      });
  
      it("debería rechazar si 'incorrectAnswers' no contiene 3 strings", async () => {
        const res = await request(app).post("/addQuestion").send({
          question: "¿Cuál es la capital de Italia?",
          correctAnswer: "Roma",
          incorrectAnswers: ["Milán", 123, true],
          category: "geografía",
        }).expect(400);
  
        expect(res.body.error).toMatch(/Invalid format/);
      });
  
      it("debería rechazar si 'category' no es un string", async () => {
        const res = await request(app).post("/addQuestion").send({
          question: "¿Cuál es la capital de España?",
          correctAnswer: "Madrid",
          incorrectAnswers: ["Lisboa", "París", "Roma"],
          category: 123,
        }).expect(400);
  
        expect(res.body.error).toMatch(/Invalid format/);
      });
  
      it("debería no guardar una pregunta duplicada (insensible a mayúsculas/minúsculas y espacios)", async () => {
        const duplicateQuestion = {
          question: "¿Cuál es la capital de Francia?",
          correctAnswer: "París",
          incorrectAnswers: ["Madrid", "Roma", "Berlín"],
          category: "geografía",
        };
  
        const res = await request(app)
          .post("/addQuestion")
          .send(duplicateQuestion)
          .expect(200);
  
        expect(res.body.message).toBe("Question already exists. Skipped insertion.");
      });  
  });

  describe("GET /questions", () => {
    it("debería devolver un array de preguntas", async () => {
      const res = await request(app).get("/questions").expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

});