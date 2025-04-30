const request = require('supertest');
const axios = require('axios');
const fetch = require('node-fetch');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

// Mock external dependencies
jest.mock('axios');
jest.mock('node-fetch');
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(() => `
    openapi: 3.0.0
    info:
      title: LLM Service API
      version: 1.0.0
    paths: {}
  `),
}));
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(() => ({})),
}));

// Mock environment variables
process.env.LLM_API_KEY = 'mock-api-key';
process.env.LLM_PROVIDER = 'gemini';
process.env.WIKIDATA_SERVICE_URL = 'http://gatewayservice:8000/api';
process.env.CORS_ORIGIN = 'http://localhost:3000';

const { server } = require('./llm-service');

describe('LLM Service', () => {
  let app;

  beforeAll(() => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(`
      openapi: 3.0.0
      info:
        title: LLM Service API
        version: 1.0.0
      paths: {}
    `);

    app = server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    app.close();
  });

  describe('GET /health', () => {
    it('should return OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');
    });
  });

  describe('POST /configureAssistant', () => {
    it('should update moderation prompt', async () => {
      const response = await request(app)
        .post('/configureAssistant')
        .send({ moderation: 'New moderation prompt' });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Moderation prompt updated' });
    });

    it('should return 400 for missing moderation field', async () => {
      const response = await request(app).post('/configureAssistant').send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing or invalid required field: moderation');
    });

    it('should return 400 for invalid moderation type', async () => {
      const response = await request(app)
        .post('/configureAssistant')
        .send({ moderation: 123 });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid moderation prompt type.');
    });
  });

  describe('POST /ask', () => {
    it('should return answer from LLM', async () => {
      axios.post.mockResolvedValue({
        data: {
          candidates: [{ content: { parts: [{ text: 'Mock answer' }] } }],
        },
      });

      const response = await request(app)
        .post('/ask')
        .send({ question: 'What is the capital of France?', apiKey: 'mock-api-key' });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ answer: 'Mock answer' });
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('gemini-1.5-flash:generateContent'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should return 400 for missing question', async () => {
      const response = await request(app).post('/ask').send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Failed to get answer: Missing or invalid required field: question');
    });

    it('should return 500 for LLM error', async () => {
      axios.post.mockRejectedValue(new Error('LLM failure'));

      const response = await request(app)
        .post('/ask')
        .send({ question: 'What is the capital of France?', apiKey: 'mock-api-key' });
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'LLM_ERROR: Failed to process request - LLM failure');
    });

    it('should handle missing API key', async () => {
      delete process.env.LLM_API_KEY;
      const response = await request(app)
        .post('/ask')
        .send({ question: 'What is the capital of France?' });
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', "LLM_ERROR: Failed to process request - API Key is required for LLM provider 'gemini'.");
      process.env.LLM_API_KEY = 'mock-api-key';
    });
  });

  describe('POST /getHint', () => {
    it('should return hint from LLM', async () => {
      axios.post.mockResolvedValue({
        data: {
          candidates: [{ content: { parts: [{ text: 'Think about European capitals.' }] } }],
        },
      });

      const response = await request(app)
        .post('/getHint')
        .send({
          question: 'What is the capital of France?',
          answers: [
            { text: 'Paris', isCorrect: true },
            { text: 'Berlin', isCorrect: false },
            { text: 'Madrid', isCorrect: false },
            { text: 'Rome', isCorrect: false },
          ],
          apiKey: 'mock-api-key',
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ hint: 'Think about European capitals.' });
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app).post('/getHint').send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Failed to generate hint: Missing or invalid required field: question');
    });

    it('should return 400 for invalid input types', async () => {
      const response = await request(app)
        .post('/getHint')
        .send({
          question: 123,
          answers: [{ text: 'Paris' }],
          apiKey: 'mock-api-key',
        });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid input types for question or answers.');
    });

    it('should return 500 for LLM error', async () => {
      axios.post.mockRejectedValue(new Error('LLM failure'));

      const response = await request(app)
        .post('/getHint')
        .send({
          question: 'What is the capital of France?',
          answers: [
            { text: 'Paris', isCorrect: true },
            { text: 'Berlin', isCorrect: false },
            { text: 'Madrid', isCorrect: false },
            { text: 'Rome', isCorrect: false },
          ],
          apiKey: 'mock-api-key',
        });
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'LLM_ERROR: Failed to process request - LLM failure');
    });
  });

  describe('POST /getHintWithQuery', () => {
    it('should return hint based on user query', async () => {
      axios.post.mockResolvedValue({
        data: {
          candidates: [{ content: { parts: [{ text: 'Consider major European cities.' }] } }],
        },
      });

      const response = await request(app)
        .post('/getHintWithQuery')
        .send({
          question: 'What is the capital of France?',
          answers: [
            { text: 'Paris', isCorrect: true },
            { text: 'Berlin', isCorrect: false },
            { text: 'Madrid', isCorrect: false },
            { text: 'Rome', isCorrect: false },
          ],
          userQuery: 'Can you give a hint about the location?',
          apiKey: 'mock-api-key',
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ hint: 'Consider major European cities.' });
    });

    it('should reject queries asking for the answer', async () => {
      const response = await request(app)
        .post('/getHintWithQuery')
        .send({
          question: 'What is the capital of France?',
          answers: [
            { text: 'Paris', isCorrect: true },
            { text: 'Berlin', isCorrect: false },
            { text: 'Madrid', isCorrect: false },
            { text: 'Rome', isCorrect: false },
          ],
          userQuery: 'What is the correct answer?',
          apiKey: 'mock-api-key',
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hint: 'Lo siento, no puedo darte la respuesta directamente. ¡Intenta adivinar o pide una pista diferente!',
      });
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app).post('/getHintWithQuery').send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Failed to generate chat hint: Missing or invalid required field: question');
    });

    it('should return 500 for LLM error', async () => {
      axios.post.mockRejectedValue(new Error('LLM failure'));

      const response = await request(app)
        .post('/getHintWithQuery')
        .send({
          question: 'What is the capital of France?',
          answers: [
            { text: 'Paris', isCorrect: true },
            { text: 'Berlin', isCorrect: false },
            { text: 'Madrid', isCorrect: false },
            { text: 'Rome', isCorrect: false },
          ],
          userQuery: 'Can you give a hint about the location?',
          apiKey: 'mock-api-key',
        });
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'LLM_ERROR: Failed to process request - LLM failure');
    });
  });

  describe('POST /generateQuestions', () => {
    
    it('should generate questions for specific category', async () => {
      axios.get.mockResolvedValue({
        data: {
          category: 'paises',
          countryLabel: 'France',
          capitalLabel: 'Paris',
          imageUrl: 'http://example.com/france.jpg',
        },
      });

      axios.post.mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: `{
                      "question": "What is the capital of France?",
                      "answers": [
                        { "text": "Paris", "isCorrect": true },
                        { "text": "Berlin", "isCorrect": false },
                        { "text": "Madrid", "isCorrect": false },
                        { "text": "Rome", "isCorrect": false }
                      ]
                    }`,
                  },
                ],
              },
            },
          ],
        },
      });

      fetch.mockResolvedValue({ ok: true, text: jest.fn(() => 'Success') });

      const response = await request(app)
        .post('/generateQuestions')
        .send({ questionCount: 1, category: 'paises', apiKey: 'mock-api-key' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions[0]).toHaveProperty('question', 'What is the capital of France?');
      expect(response.body.questions[0]).toHaveProperty('imageUrl', 'http://example.com/france.jpg');
    });


    it('should return 500 if no valid questions generated', async () => {
      axios.get.mockResolvedValue({
        data: [
          {
            category: 'paises',
            countryLabel: 'France',
            capitalLabel: 'Paris',
            imageUrl: 'http://example.com/france.jpg',
          },
        ],
      });

      axios.post.mockResolvedValue({
        data: {
          candidates: [{ content: { parts: [{ text: 'Invalid response' }] } }],
        },
      });

      const response = await request(app)
        .post('/generateQuestions')
        .send({ questionCount: 1, category: 'variado', apiKey: 'mock-api-key' });
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'No se pudieron generar preguntas válidas.');
    });

    it('should handle Empathy provider', async () => {
      process.env.LLM_PROVIDER = 'empathy';
      axios.get.mockResolvedValue({
        data: [
          {
            category: 'paises',
            countryLabel: 'France',
            capitalLabel: 'Paris',
            imageUrl: 'http://example.com/france.jpg',
          },
        ],
      });

      axios.post.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: `{
                  "question": "What is the capital of France?",
                  "answers": [
                    { "text": "Paris", "isCorrect": true },
                    { "text": "Berlin", "isCorrect": false },
                    { "text": "Madrid", "isCorrect": false },
                    { "text": "Rome", "isCorrect": false }
                  ]
                }`,
              },
            },
          ],
        },
      });

      fetch.mockResolvedValue({ ok: true, text: jest.fn(() => 'Success') });

      const response = await request(app)
        .post('/generateQuestions')
        .send({ questionCount: 1, category: 'variado', apiKey: 'mock-api-key' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions[0]).toHaveProperty('question', 'What is the capital of France?');
      process.env.LLM_PROVIDER = 'gemini';
    });

    it('should retry invalid LLM responses', async () => {
      axios.get.mockResolvedValue({
        data: [
          {
            category: 'paises',
            countryLabel: 'France',
            capitalLabel: 'Paris',
            imageUrl: 'http://example.com/france.jpg',
          },
        ],
      });

      axios.post
        .mockResolvedValueOnce({
          data: {
            candidates: [{ content: { parts: [{ text: 'Invalid response' }] } }],
          },
        })
        .mockResolvedValueOnce({
          data: {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: `{
                        "question": "What is the capital of France?",
                        "answers": [
                          { "text": "Paris", "isCorrect": true },
                          { "text": "Berlin", "isCorrect": false },
                          { "text": "Madrid", "isCorrect": false },
                          { "text": "Rome", "isCorrect": false }
                        ]
                      }`,
                    },
                  ],
                },
              },
            ],
          },
        });

      fetch.mockResolvedValue({ ok: true, text: jest.fn(() => 'Success') });

      const response = await request(app)
        .post('/generateQuestions')
        .send({ questionCount: 1, category: 'variado', apiKey: 'mock-api-key' });
      expect(response.status).toBe(200);
      expect(response.body.questions[0]).toHaveProperty('question', 'What is the capital of France?');
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('should return 500 after max retries for invalid LLM responses', async () => {
      axios.get.mockResolvedValue({
        data: [
          {
            category: 'paises',
            countryLabel: 'France',
            capitalLabel: 'Paris',
            imageUrl: 'http://example.com/france.jpg',
          },
        ],
      });

      axios.post.mockResolvedValue({
        data: {
          candidates: [{ content: { parts: [{ text: 'Invalid response' }] } }],
        },
      });

      const response = await request(app)
        .post('/generateQuestions')
        .send({ questionCount: 1, category: 'variado', apiKey: 'mock-api-key' });
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'No se pudieron generar preguntas válidas.');
      expect(axios.post).toHaveBeenCalledTimes(3);
    });

    it('should handle different categories', async () => {
      axios.get.mockResolvedValue({
        data: {
          category: 'monumentos',
          monumentLabel: 'Eiffel Tower',
          countryLabel: 'France',
          imageUrl: 'http://example.com/eiffel.jpg',
        },
      });

      axios.post.mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: `{
                      "question": "In which country is the Eiffel Tower located?",
                      "answers": [
                        { "text": "France", "isCorrect": true },
                        { "text": "Italy", "isCorrect": false },
                        { "text": "Spain", "isCorrect": false },
                        { "text": "Germany", "isCorrect": false }
                      ]
                    }`,
                  },
                ],
              },
            },
          ],
        },
      });

      fetch.mockResolvedValue({ ok: true, text: jest.fn(() => 'Success') });

      const response = await request(app)
        .post('/generateQuestions')
        .send({ questionCount: 1, category: 'monumentos', apiKey: 'mock-api-key' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions[0]).toHaveProperty('question', 'In which country is the Eiffel Tower located?');
      expect(response.body.questions[0]).toHaveProperty('imageUrl', 'http://example.com/eiffel.jpg');
    });
});
});