const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let History;

beforeAll(async () => {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  History = require('./history-model')(mongoose);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoose.connection.close();
});

describe('History Model', () => {
  it('should create and save a valid history record', async () => {
    const validData = {
      username: 'test_user',
      score: 85,
      correctQuestions: 8,
      gameId: 'game123',
      totalQuestions: 10,
      difficulty: 'medium',
      category: 'science',
      timeTaken: 60,
    };

    const record = new History(validData);
    const saved = await record.save();

    expect(saved._id).toBeDefined();
    expect(saved.username).toBe(validData.username);
    expect(saved.recordedAt).toBeInstanceOf(Date);
  });

  it('should fail if required fields are missing', async () => {
    const invalidData = {
      username: 'test_user',
      score: 90,
      // Missing correctQuestions, gameId, totalQuestions, difficulty
    };

    try {
      const record = new History(invalidData);
      await record.save();
    } catch (err) {
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.correctQuestions).toBeDefined();
      expect(err.errors.gameId).toBeDefined();
      expect(err.errors.totalQuestions).toBeDefined();
      expect(err.errors.difficulty).toBeDefined();
    }
  });

  it('should set recordedAt to current date by default', async () => {
    const data = {
      username: 'auto_date_test',
      score: 70,
      correctQuestions: 7,
      gameId: 'game456',
      totalQuestions: 10,
      difficulty: 'easy',
    };

    const record = new History(data);
    const saved = await record.save();

    const now = new Date();
    expect(saved.recordedAt).toBeInstanceOf(Date);
    expect(saved.recordedAt.getFullYear()).toBe(now.getFullYear());
  });
});
