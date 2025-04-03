const request = require('supertest');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const app = require('./user-service');

jest.mock('../../llmservice/config/database.js');
//jest.setTimeout(10000); // 10 segundos de timeout

const User = require("../../llmservice/models/user-model")(mongoose);

describe('User Service', () => {
  beforeAll(() => {
      mongoose.connect = jest.fn().mockResolvedValue(true);
    });
  
  afterAll(() => {
      mongoose.connection.close();
    });

  it('should add a new user on POST /adduser', async () => {
    const newUser = {
      username: 'testuser',
      password: 'testpassword',
    };

    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');

    // Check if the user is inserted into the database
    const userInDb = await User.findOne({ username: 'testuser' });

    // Assert that the user exists in the database
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe('testuser');

    // Assert that the password is encrypted
    const isPasswordValid = await bcrypt.compare('testpassword', userInDb.password);
    expect(isPasswordValid).toBe(true);
  });
});
