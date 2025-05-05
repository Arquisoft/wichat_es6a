const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./auth-model');

let mongoServer;
let app;
let server;  // Variable para el servidor

// Test user
const testUser = {
  username: 'testuser',
  password: 'testpassword',
};

async function addUser(user) {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  const newUser = new User({
    username: user.username,
    password: hashedPassword,
    createdAt: new Date()
  });
  await newUser.save();
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Mockea mongoose.connect para que no se realice una conexión real
  jest.spyOn(mongoose, 'connect').mockResolvedValueOnce();  // Evita que mongoose.connect haga algo

  // Ahora conecta Mongoose usando MongoMemoryServer
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Importa la app y el servidor de auth-service.js
  const mod = require('./auth-service');
  app = mod.app;
  server = mod.server;  // Guarda el servidor aquí

  // Inserta el usuario de prueba
  await addUser(testUser);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
  server.close();  // Cierra el servidor después de los tests
});

describe('Auth Service', () => {
  it('Should successfully log in with correct credentials', async () => {
    const response = await request(app).post('/login').send(testUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('username', testUser.username);
    expect(response.body).toHaveProperty('userId');
  });

  it('Should fail login with incorrect password', async () => {
    const response = await request(app).post('/login').send({
      username: testUser.username,
      password: 'wrongpassword',
    });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });

  it('Should fail login with non-existing username', async () => {
    const response = await request(app).post('/login').send({
      username: 'nonexistentuser',
      password: 'somepassword',
    });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });

  it('Should fail if username is missing', async () => {
    const response = await request(app).post('/login').send({
      password: testUser.password,
    });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('Should fail if password is missing', async () => {
    const response = await request(app).post('/login').send({
      username: testUser.username,
    });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('Should fail if username or password are too short', async () => {
    const response = await request(app).post('/login').send({
      username: 'ab',
      password: 'cd',
    });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('Should return 500 if an internal error occurs', async () => {
    const originalFindOne = User.findOne;
    User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

    const response = await request(app).post('/login').send(testUser);
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Internal Server Error');

    User.findOne = originalFindOne;
  });
});
