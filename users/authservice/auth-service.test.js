const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const User = require('./auth-model');
mongoose = require('mongoose');
const app = require('./auth-service');

jest.mock('../../llmservice/config/database.js');
jest.setTimeout(10000); // 10 segundos de timeout

//test user
const user = {
  username: 'testuser',
  password: 'testpassword',
};

async function addUser(user){
  const hashedPassword = await bcrypt.hash(user.password, 10);
  const newUser = new User({
    username: user.username,
    password: hashedPassword,
  });

  await newUser.save();
}

beforeAll(() => {
  mongoose.connect = jest.fn().mockResolvedValue(true);
  addUser(user);
});
  
afterAll(() => {
  mongoose.connection.close();
});

describe('Auth Service', () => {
  it('Should perform a login operation /login', async () => {
    const response = await request(app).post('/login').send(user);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');
  });
});
