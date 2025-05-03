const request = require('supertest');
const { app } = require('./question-history-service');

jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    model: jest.fn().mockReturnValue({
      find: jest.fn(),
      create: jest.fn(),
    }),
    Schema: actualMongoose.Schema,
  };
});

const mongoose = require('mongoose');
const QuestionsMock = mongoose.model();

describe('Question History Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ status: 'OK' });
    });
  });

  describe('POST /addQuestion', () => {
    const validQuestion = {
      question: '¿Cuál es la capital de Francia?',
      correctAnswer: 'París',
      incorrectAnswers: ['Londres', 'Madrid', 'Berlín'],
      category: 'geografía',
      imageUrl: 'http://example.com/image.jpg',
    };

    it('should add a new question successfully', async () => {
      QuestionsMock.find.mockResolvedValue([]);
      QuestionsMock.create.mockResolvedValue({});

      const res = await request(app).post('/addQuestion').send(validQuestion);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Question saved successfully.');
      expect(QuestionsMock.create).toHaveBeenCalled();
    });

    it('should skip if question already exists', async () => {
      QuestionsMock.find.mockResolvedValue([{ question: '¿Cuál es la capital de Francia?' }]);

      const res = await request(app).post('/addQuestion').send(validQuestion);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('already exists');
    });

    it('should return 400 if data is invalid', async () => {
      const res = await request(app).post('/addQuestion').send({
        question: 123,
        correctAnswer: true,
        incorrectAnswers: 'mal',
        category: null,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Invalid format/);
    });

    it('should handle internal server error', async () => {
      QuestionsMock.find.mockRejectedValue(new Error('DB Error'));

      const res = await request(app).post('/addQuestion').send(validQuestion);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toContain('Internal server error');
    });
  });

  describe('GET /questions', () => {
    it('should return list of questions', async () => {
      QuestionsMock.find.mockResolvedValue([
        {
          question: '¿Cuál es la capital de Francia?',
          correctAnswer: 'París',
          incorrectAnswers: ['Londres', 'Madrid', 'Berlín'],
          category: 'geografía',
          imageUrl: null,
        },
      ]);

      const res = await request(app).get('/questions');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].question).toContain('Francia');
    });

    it('should handle DB errors', async () => {
      QuestionsMock.find.mockRejectedValue(new Error('DB down'));

      const res = await request(app).get('/questions');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toMatch(/Error fetching questions/);
    });
  });
});
