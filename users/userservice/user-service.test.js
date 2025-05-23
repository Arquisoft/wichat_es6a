const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Mock fetch
require('jest-fetch-mock').enableMocks();

let app;
let mongoServer;
let User;

const TEST_USER = process.env.TEST_USER || 'testuser';
const TEST_PASS = process.env.TEST_PASS || 'testpassword';
const ALT_USER = process.env.ALT_USER || 'existinguser';
const ALT_PASS = process.env.ALT_PASS || 'anotherpass';
const NEW_PASS = process.env.NEW_PASS || 'newpassword';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {});

  // Cargar los modelos usando el mongoose de test
  User = require('./models/user-model')(mongoose);
  app = require('./user-service');
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
  await app.close();
});

describe('User Service', () => {
  let userId;

  it('should add a new user on POST /adduser', async () => {
    const newUser = { username: TEST_USER, password: TEST_PASS };
    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', TEST_USER);

    const userInDb = await User.findOne({ username: TEST_USER });
    expect(userInDb).not.toBeNull();
    userId = userInDb._id;
  });

  it('should fail to add a user with existing username', async () => {
    const response = await request(app).post('/adduser').send({ username: TEST_USER, password: ALT_PASS });
    expect(response.status).toBe(400);
  });

  it('should get user details on GET /user/:id', async () => {
    const response = await request(app).get(`/user/${userId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', TEST_USER);
  });

  it('should return 404 for non-existing user on GET /user/:id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/user/${fakeId}`);
    expect(response.status).toBe(404);
  });

  it('should change username on PUT /user/:id/username', async () => {
    const response = await request(app).put(`/user/${userId}/username`).send({ username: 'updateduser' });
    expect(response.status).toBe(200);

    const updatedUser = await User.findById(userId);
    expect(updatedUser.username).toBe('updateduser');
  });

  it('should fail to change username if new username already exists', async () => {
    const anotherUser = new User({ username: ALT_USER, password: ALT_PASS });
    await anotherUser.save();

    fetch.mockResponseOnce(JSON.stringify({ message: 'Username updated in user games successfully' }));
    const response = await request(app).put(`/user/${userId}/username`).send({ username: ALT_USER });
    expect(response.status).toBe(400);
  });

  it('should update password on PUT /user/:id/password', async () => {
    const response = await request(app).put(`/user/${userId}/password`).send({
      currentPassword: TEST_PASS,
      newPassword: NEW_PASS,
      confirmPassword: NEW_PASS,
    });
    expect(response.status).toBe(200);

    const user = await User.findById(userId);
    const passwordMatches = await bcrypt.compare(NEW_PASS, user.password);
    expect(passwordMatches).toBe(true);
  });

  it('should fail to update password if current password is wrong', async () => {
    const response = await request(app).put(`/user/${userId}/password`).send({
      currentPassword: 'wrongpassword',
      newPassword: NEW_PASS,
      confirmPassword: NEW_PASS,
    });
    expect(response.status).toBe(400);
  });

  it('should upload profile picture on POST /user/:id/profile-pic', async () => {
    const response = await request(app)
      .post(`/user/${userId}/profile-pic`)
      .attach('profilePic', Buffer.from('testimagecontent'), 'profile.png');

    expect(response.status).toBe(200);
  });

  it('should get profile picture on GET /user/:id/profile-pic', async () => {
    const response = await request(app).get(`/user/${userId}/profile-pic`);
    expect(response.status).toBe(200);
  });

  it('should delete profile picture on DELETE /user/:id/profile-pic', async () => {
    const response = await request(app).delete(`/user/${userId}/profile-pic`);
    expect(response.status).toBe(200);
  });
});