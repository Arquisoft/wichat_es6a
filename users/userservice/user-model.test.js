const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let User;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Importa el modelo pasando mongoose
  User = require('./models/user-model')(mongoose);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany(); // Limpia entre pruebas
});

test('Guarda un usuario válido', async () => {
  const userData = {
    username: 'testuser',
    password: 'supersecure123',
  };

  const user = new User(userData);
  const saved = await user.save();

  expect(saved._id).toBeDefined();
  expect(saved.username).toBe(userData.username);
  expect(saved.createdAt).toBeInstanceOf(Date);
});

test('Falla si falta el username', async () => {
  const userData = {
    password: 'abc123'
  };

  const user = new User(userData);
  await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
});
