const request = require('supertest');
const axios = require('axios');
const app = require('./llm-service');

afterAll(async () => {
    app.close();
});

jest.mock('axios');

describe('LLM Service', () => {
    // Mock de respuestas del servicio LLM
    axios.post.mockImplementation((url, data) => {
        if (url.startsWith('https://empathyai')) {
            return Promise.resolve({ data: { choices: [{ message: { content: 'llmanswer' } }] } });
        }
    });

    // Test para /ask
    it('should return an answer from LLM', async () => {
        const response = await request(app)
            .post('/ask')
            .send({ question: 'a question', apiKey: 'apiKey' });

        expect(response.statusCode).toBe(200);
        expect(response.body.answer).toBe('llmanswer');
    });

    // Mock de respuesta para el servicio de Wikidata
    axios.get.mockImplementation(() =>
        Promise.resolve({
            data: [
                { countryLabel: 'Francia', capitalLabel: 'París' },
                { countryLabel: 'España', capitalLabel: 'Madrid' }
            ]
        })
    );

    // Test para /generateQuestions
    it('should generate questions based on context', async () => {
        const response = await request(app)
            .post('/generateQuestions')
            .send({ context: 'Historia de los países', apiKey: 'apiKey' });

        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('llmanswer');
    });

    // Test para /getHint
    it('should return a hint for a question', async () => {
        const response = await request(app)
            .post('/getHint')
            .send({
                question: '¿Cuál es la capital de Francia?',
                answers: [
                    { text: 'París', correct: true },
                    { text: 'Madrid', correct: false },
                    { text: 'Berlín', correct: false },
                    { text: 'Roma', correct: false }
                ],
                apiKey: 'apiKey'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.hint).toBeDefined();
    });

    // Test para /getHintWithQuery
    it('should return a hint with a user query', async () => {
        const response = await request(app)
            .post('/getHintWithQuery')
            .send({
                question: '¿Cuál es la capital de Francia?',
                answers: [
                    { text: 'París', correct: true },
                    { text: 'Madrid', correct: false },
                    { text: 'Berlín', correct: false },
                    { text: 'Roma', correct: false }
                ],
                userQuery: 'Dame una pista sobre la geografía de Europa',
                apiKey: 'apiKey'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.hint).toBeDefined();
    });

    // Punto 3: Validar que faltando campos requeridos se responde con 400
    it('should return 400 when required fields are missing in /ask', async () => {
        const response = await request(app)
            .post('/ask')
            .send({ apiKey: 'apiKey' });  // Falta el campo "question"

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Missing required field: question');
    });

    it('should return 400 when required fields are missing in /generateQuestions', async () => {
        const response = await request(app)
            .post('/generateQuestions')
            .send({ apiKey: 'apiKey' });  // Falta el campo "context"

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Missing context');
    });

    // Punto 4: Simular fallo en la API externa y responder con 500
    it('should return 500 when external API fails in /generateQuestions', async () => {
        // Simulando que la API externa (Wikidata) falla
        axios.get.mockImplementationOnce(() =>
            Promise.reject(new Error('External API error'))
        );

        const response = await request(app)
            .post('/generateQuestions')
            .send({ context: 'Historia de los países', apiKey: 'apiKey' });

        expect(response.statusCode).toBe(500);
        expect(response.body.error).toBe('Failed to generate questions');
    });

    it('should return 500 when external API fails in /ask', async () => {
      // Simulando que la API externa (LLM) falla
      axios.post.mockImplementationOnce(() =>
        Promise.reject(new Error('External API error'))
      );
    
      const response = await request(app)
        .post('/ask')
        .send({ question: 'a question', apiKey: 'apiKey' });
    
      // Verificar que el código de estado es 500
      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBe('Error processing request.');
    });
    
    it('should return 500 when external API fails in /getHint', async () => {
      // Simulando que la API externa (LLM) falla
      axios.post.mockImplementationOnce(() =>
        Promise.reject(new Error("External API error"))
      );
    
      const response = await request(app)
        .post('/getHint')
        .send({
          question: '¿Cuál es la capital de Francia?',
          answers: [
            { text: 'París', correct: true },
            { text: 'Madrid', correct: false },
            { text: 'Berlín', correct: false },
            { text: 'Roma', correct: false }
          ],
          apiKey: 'apiKey'
        });
    
      // Verificar que el código de estado es 500
      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBe("External API error");
    });
    
  
});
