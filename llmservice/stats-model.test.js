const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let UserGames;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Importa correctamente el modelo pasándole mongoose
  UserGames = require('./models/stats-model')(mongoose);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await UserGames.deleteMany(); // Limpia entre tests
});

test('Guarda un usuario con partidas embebidas', async () => {
  const userData = {
    username: 'testuser',
    password: 'secure123',
    games: [
      {
        score: 80,
        correctQuestions: 8,
        gameId: 1
      },
      {
        score: 90,
        correctQuestions: 9,
        gameId: 2
      }
    ]
  };

  const user = new UserGames(userData);
  const savedUser = await user.save();

  expect(savedUser._id).toBeDefined();
  expect(savedUser.games.length).toBe(2);
  expect(savedUser.games[0].score).toBe(80);
  expect(savedUser.games[1].gameId).toBe(2);
});

test('Falla si falta un campo requerido en usuario', async () => {
  const incompleteData = {
    // falta username
    password: 'abc123'
  };

  const user = new UserGames(incompleteData);
  await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
});

test('Falla si una partida embebida tiene campos faltantes', async () => {
  const badGameData = {
    username: 'invalidgameuser',
    password: 'pass',
    games: [
      {
        // falta correctQuestions
        score: 70,
        gameId: 3
      }
    ]
  };

  const user = new UserGames(badGameData);
  await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
});
