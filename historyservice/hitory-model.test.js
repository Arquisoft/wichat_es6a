const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let History;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // IMPORTA EL MODELO PASANDO mongoose
  History = require('./models/history-model')(mongoose);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await History.deleteMany(); // Limpia entre tests
});

test('Guarda un documento válido en el modelo History', async () => {
  const historyData = {
    username: 'usuario_test',
    score: 100,
    correctQuestions: 10,
    gameId: 'game_abc',
    totalQuestions: 10,
    difficulty: 'hard',
  };

  const history = new History(historyData);
  const saved = await history.save();

  expect(saved._id).toBeDefined();
  expect(saved.username).toBe(historyData.username);
  expect(saved.recordedAt).toBeInstanceOf(Date);
});

test('Falla al guardar si falta un campo requerido', async () => {
  const invalidData = {
    score: 100,
    correctQuestions: 10,
    gameId: 'game_abc',
    totalQuestions: 10,
    difficulty: 'hard',
  };

  const history = new History(invalidData);
  await expect(history.save()).rejects.toThrow(mongoose.Error.ValidationError);
});

test('Guarda correctamente si no se pasa el campo category (no requerido)', async () => {
  const historyData = {
    username: 'usuario_test_2',
    score: 200,
    correctQuestions: 15,
    gameId: 'game_xyz',
    totalQuestions: 15,
    difficulty: 'medium',
  };

  const history = new History(historyData);
  const saved = await history.save();

  expect(saved._id).toBeDefined();
  expect(saved.username).toBe(historyData.username);
  expect(saved.category).toBeUndefined();  // Comprobar que 'category' es opcional
});

test('Guarda correctamente si no se pasa el campo timeTaken (no requerido)', async () => {
  const historyData = {
    username: 'usuario_test_3',
    score: 150,
    correctQuestions: 12,
    gameId: 'game_xyz_2',
    totalQuestions: 15,
    difficulty: 'easy',
  };

  const history = new History(historyData);
  const saved = await history.save();

  expect(saved._id).toBeDefined();
  expect(saved.username).toBe(historyData.username);
  expect(saved.timeTaken).toBeUndefined();  // Comprobar que 'timeTaken' es opcional
});

test('El campo recordedAt usa la fecha por defecto si no se pasa', async () => {
  const historyData = {
    username: 'usuario_test_4',
    score: 180,
    correctQuestions: 13,
    gameId: 'game_xyz_3',
    totalQuestions: 15,
    difficulty: 'hard',
  };

  const history = new History(historyData);
  const saved = await history.save();

  expect(saved._id).toBeDefined();
  expect(saved.recordedAt).toBeInstanceOf(Date);  // El valor por defecto debe ser una fecha
});

test('Falla al guardar si falta un campo requerido (score)', async () => {
  const invalidData = {
    username: 'usuario_test_5',
    correctQuestions: 10,
    gameId: 'game_abc_3',
    totalQuestions: 10,
    difficulty: 'hard',
  };

  const history = new History(invalidData);
  await expect(history.save()).rejects.toThrow(mongoose.Error.ValidationError);
});

test('Falla al guardar si falta un campo requerido (correctQuestions)', async () => {
  const invalidData = {
    username: 'usuario_test_6',
    score: 100,
    gameId: 'game_abc_4',
    totalQuestions: 10,
    difficulty: 'easy',
  };

  const history = new History(invalidData);
  await expect(history.save()).rejects.toThrow(mongoose.Error.ValidationError);
});

test('Falla al guardar si falta un campo requerido (gameId)', async () => {
  const invalidData = {
    username: 'usuario_test_7',
    score: 100,
    correctQuestions: 10,
    totalQuestions: 10,
    difficulty: 'medium',
  };

  const history = new History(invalidData);
  await expect(history.save()).rejects.toThrow(mongoose.Error.ValidationError);
});

test('El modelo no se compila de nuevo si ya existe un modelo con ese nombre', () => {
  const historyModel1 = require('./models/history-model')(mongoose);
  const historyModel2 = require('./models/history-model')(mongoose);

  expect(historyModel1).toBe(historyModel2);  // Ambos modelos deben ser el mismo
});
