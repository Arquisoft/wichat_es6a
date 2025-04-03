const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./history-stats-service');

// Simulamos la conexión con la base de datos MongoDB
jest.mock('../llmservice/config/database.js');
jest.setTimeout(10000); // 10 segundos de timeout

describe('History Service API', () => {
  beforeAll(() => {
    mongoose.connect = jest.fn().mockResolvedValue(true);
  });

  afterAll(() => {
    mongoose.connection.close();
  });

  it('should return stats for a valid username', async () => {
    const mockStats = {
      username: "testuser",
      gamesPlayed: 3,
      totalPoints: 150,
      pointsPerGame: 50,
      wins: 2,
      losses: 1,
      bestGames: [
        {
          id: 'game1',
          points: 100,
          date: '2023-04-01T00:00:00Z',
          category: 'Trivia',
          timeTaken: 30
        }
      ],
      mostPlayedCategory: "Trivia",
      averageGameTime: 25
    };

    const UserGame = require('../llmservice/models/history-model')(mongoose);
    UserGame.find = jest.fn().mockResolvedValue([{ score: 100, category: 'Trivia', timeTaken: 30, gameId: 'game1', recordedAt: new Date() }]);

    const response = await request(app)
      .get('/stats')
      .set('username', 'testuser')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.username).toBe('testuser');
    expect(response.body.gamesPlayed).toBe(1);
    expect(response.body.totalPoints).toBe(100);
    expect(response.body.wins).toBe(1);
    expect(response.body.losses).toBe(0);
    expect(response.body.bestGames[0].id).toBe('game1');
    expect(response.body.mostPlayedCategory).toBe('Trivia');
  });

  it('should return 400 if username is not provided in /stats', async () => {
    const response = await request(app)
      .get('/stats')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.message).toBe('Username is required');
  });

  it('should return a 201 status for a valid /addGame POST request', async () => {
    const newGame = {
      username: "testuser",
      score: 80,
      correctQuestions: 10,
      gameId: "game123",
      category: "Math",
      timeTaken: 20
    };

    const UserGame = require('../llmservice/models/history-model')(mongoose);
    const mockSavedGame = {
      username: newGame.username,
      score: newGame.score,
      correctQuestions: newGame.correctQuestions,
      gameId: newGame.gameId,
      recordedAt: new Date(),
      category: newGame.category,
      timeTaken: newGame.timeTaken
    };

    jest.spyOn(UserGame.prototype, 'save').mockResolvedValue(mockSavedGame);

    const response = await request(app)
      .post('/addGame')
      .send(newGame)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.message).toBe('Game successfully added');
    expect(response.body.game.username).toBe(newGame.username);
    expect(response.body.game.score).toBe(newGame.score);
    expect(response.body.game.gameId).toBe(newGame.gameId);

    jest.restoreAllMocks();
  });

  it('should return 400 for invalid data in /addGame POST request', async () => {
    const invalidGame = {
      username: "testuser",
      score: -10,
      correctQuestions: 5,
      gameId: "game123"
    };

    const response = await request(app)
      .post('/addGame')
      .send(invalidGame)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors).toContain('Score cannot be negative');
  });
});