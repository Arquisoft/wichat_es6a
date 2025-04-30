const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

let app;
let mongoServer;
let User;
let History;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {});

  // Cargar los modelos usando el mongoose de test
  User = require('../../llmservice/models/user-model')(mongoose);
  History = require('../../llmservice/models/history-model')(mongoose);

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
    const newUser = { username: 'testuser', password: 'testpassword' };
    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');

    const userInDb = await User.findOne({ username: 'testuser' });
    expect(userInDb).not.toBeNull();
    userId = userInDb._id;
  });

  it('should fail to add a user with existing username', async () => {
    const response = await request(app).post('/adduser').send({ username: 'testuser', password: 'anotherpass' });
    expect(response.status).toBe(400);
  });

  it('should get user details on GET /user/:id', async () => {
    const response = await request(app).get(`/user/${userId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');
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
    const anotherUser = new User({ username: 'existinguser', password: 'pass' });
    await anotherUser.save();

    const response = await request(app).put(`/user/${userId}/username`).send({ username: 'existinguser' });
    expect(response.status).toBe(400);
  });

  it('should update password on PUT /user/:id/password', async () => {
    const response = await request(app).put(`/user/${userId}/password`).send({
      currentPassword: 'testpassword',
      newPassword: 'newpassword',
      confirmPassword: 'newpassword',
    });
    expect(response.status).toBe(200);

    const user = await User.findById(userId);
    const passwordMatches = await bcrypt.compare('newpassword', user.password);
    expect(passwordMatches).toBe(true);
  });

  it('should fail to update password if current password is wrong', async () => {
    const response = await request(app).put(`/user/${userId}/password`).send({
      currentPassword: 'wrongpassword',
      newPassword: 'newpassword',
      confirmPassword: 'newpassword',
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
