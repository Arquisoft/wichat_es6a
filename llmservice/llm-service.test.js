const axios = require('axios');
const request = require('supertest');
const llmService = require('./llm-service');
const app = llmService.app;

// Mock axios para evitar llamadas reales a APIs
jest.mock('axios');

describe('LLM Service', () => {
  let originalModeration;

  beforeAll(() => {
    // Guardar el valor original de moderation
    originalModeration = llmService.getModeration();
    // Mock console.log para evitar output en tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(async () => {
    // Restaurar el valor original
    llmService.setModeration(originalModeration);
    // Restaurar console.log
    console.log.mockRestore();
    console.error.mockRestore();
    // Cerrar el servidor
    await llmService.close();
  });

  beforeEach(() => {
    // Resetear mocks y estado antes de cada test
    jest.clearAllMocks();
    llmService.setModeration("You are a quiz game assistant.");
  });

  describe('Configuration Tests', () => {
    it('should have default moderation prompt', () => {
      expect(llmService.getModeration()).toBe("You are a quiz game assistant.");
    });

    it('should update moderation prompt via /configureAssistant', async () => {
      const newPrompt = "New moderation prompt";
      const response = await request(app)
        .post('/configureAssistant')
        .send({ moderation: newPrompt });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Moderation prompt updated");
      expect(response.body.currentModeration).toBe(newPrompt);
      expect(llmService.getModeration()).toBe(newPrompt);
    });

    it('should return 400 when no moderation prompt provided', async () => {
      const response = await request(app)
        .post('/configureAssistant')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing moderation prompt");
    });

    it('should not affect moderation prompt when request fails', async () => {
      const currentValue = llmService.getModeration();
      const response = await request(app)
        .post('/configureAssistant')
        .send({});
      
      expect(llmService.getModeration()).toBe(currentValue);
    });
  });

  describe('Question Asking Tests', () => {
    it('should successfully send question to LLM', async () => {
      const mockResponse = { 
        data: { 
          candidates: [{ 
            content: { 
              parts: [{ 
                text: 'Test answer' 
              }] 
            } 
          }] 
        } 
      };
      axios.post.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/ask')
        .send({ question: 'Test question' });
      
      expect(response.status).toBe(200);
      expect(response.body.answer).toBe('Test answer');
    });

    it('should require question field', async () => {
      const response = await request(app)
        .post('/ask')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Missing required field/);
    });

    it('should handle LLM errors gracefully', async () => {
      axios.post.mockRejectedValue(new Error('LLM error'));

      const response = await request(app)
        .post('/ask')
        .send({ question: 'Test question' });
      
      expect(response.status).toBe(200);
      expect(response.body.answer).toBe('Error processing request.');
    });
  });

  describe('JSON Parsing Tests', () => {
    it('should parse clean JSON response', () => {
      const jsonString = '{"key": "value"}';
      const result = llmService.parseJsonResponse(jsonString);
      expect(result).toEqual({ key: 'value' });
    });

    it('should parse JSON with code blocks', () => {
      const jsonString = '```json\n{"key": "value"}\n```';
      const result = llmService.parseJsonResponse(jsonString);
      expect(result).toEqual({ key: 'value' });
    });

    it('should parse JSON with escaped characters', () => {
      const jsonString = '{\\"key\\": \\"value\\"}';
      const result = llmService.parseJsonResponse(jsonString);
      expect(result).toEqual({ key: 'value' });
    });

    it('should extract JSON from text', () => {
      const jsonString = 'Some text {\n  "key": "value"\n} more text';
      const result = llmService.parseJsonResponse(jsonString);
      expect(result).toEqual({ key: 'value' });
    });

    it('should throw error for invalid JSON', () => {
      const jsonString = 'invalid json';
      expect(() => llmService.parseJsonResponse(jsonString)).toThrow();
    });
  });

  describe('Question Generation Tests', () => {
    beforeEach(() => {
      // Mock para Wikidata
      axios.get.mockImplementation((url) => {
        if (url.includes('/entries/paises')) {
          return Promise.resolve({
            data: {
              category: 'paises',
              countryLabel: 'Spain',
              capitalLabel: 'Madrid'
            }
          });
        }
        if (url.includes('/entries/random')) {
          return Promise.resolve({
            category: 'paises',
            countryLabel: 'France',
            capitalLabel: 'Paris'
          });
        }
        return Promise.reject(new Error('Invalid category'));
      });

      // Mock para LLM
      axios.post.mockResolvedValue({
        data: {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  question: "What is the capital?",
                  answers: [
                    { text: "Madrid", correct: true },
                    { text: "Barcelona", correct: false },
                    { text: "Valencia", correct: false },
                    { text: "Seville", correct: false }
                  ]
                })
              }]
            }
          }]
        }
      });
    });

    it('should generate questions from random entries', async () => {
      const response = await request(app)
        .post('/generateQuestions')
        .send({ questionCount: 1, category: 'variado' });
      
      expect(response.status).toBe(200);
      expect(response.body.questions).toHaveLength(1);
      expect(response.body.questions[0].answers).toHaveLength(4);
    });

    it('should generate questions for specific category', async () => {
      const response = await request(app)
        .post('/generateQuestions')
        .send({ questionCount: 1, category: 'paises' });
      
      expect(response.status).toBe(200);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/entries/paises'));
    });

    it('should handle Wikidata API errors', async () => {
      axios.get.mockRejectedValue(new Error('Wikidata error'));

      const response = await request(app)
        .post('/generateQuestions')
        .send({ questionCount: 1, category: 'invalid' });
      
      expect(response.status).toBe(500);
    });

    it('should handle LLM generation errors', async () => {
      axios.post.mockRejectedValue(new Error('LLM error'));

      const response = await request(app)
        .post('/generateQuestions')
        .send({ questionCount: 1 });
      
      expect(response.status).toBe(500);
    });
  });

  describe('Hint Generation Tests', () => {
    beforeEach(() => {
      axios.post.mockResolvedValue({
        data: {
          candidates: [{
            content: {
              parts: [{
                text: 'This is a test hint'
              }]
            }
          }]
        }
      });
    });

    it('should generate hint for question', async () => {
      const response = await request(app)
        .post('/getHint')
        .send({
          question: "Test question",
          answers: [
            { text: "Answer 1" },
            { text: "Answer 2" }
          ]
        });
      
      expect(response.status).toBe(200);
      expect(response.body.hint).toBe('This is a test hint');
    });

    it('should generate hint with user query', async () => {
      const response = await request(app)
        .post('/getHintWithQuery')
        .send({
          question: "Test question",
          answers: [
            { text: "Answer 1" },
            { text: "Answer 2" }
          ],
          userQuery: "Test query"
        });
      
      expect(response.status).toBe(200);
      expect(response.body.hint).toBe('This is a test hint');
    });

    it('should reject hint requests with missing data', async () => {
      const response = await request(app)
        .post('/getHint')
        .send({});
      
      expect(response.status).toBe(400);
    });
  });
});