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

  // Load models using the test mongoose instance
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

  // Clear the User collection before each test to ensure a clean state
  beforeEach(async () => {
    await User.deleteMany({});
  });

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
    await new User({ username: 'testuser', password: 'testpassword' }).save();
    const response = await request(app).post('/adduser').send({ username: 'testuser', password: 'anotherpass' });
    expect(response.status).toBe(400);
  });

  it('should get user details on GET /user/:id', async () => {
    const user = await new User({ username: 'testuser', password: 'testpassword' }).save();
    userId = user._id;
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
    const user = await new User({ username: 'testuser', password: 'testpassword' }).save();
    userId = user._id;
    const response = await request(app).put(`/user/${userId}/username`).send({ username: 'updateduser' });
    expect(response.status).toBe(200);

    const updatedUser = await User.findById(userId);
    expect(updatedUser.username).toBe('updateduser');
  });

  it('should fail to change username if new username already exists', async () => {
    await new User({ username: 'existinguser', password: 'pass' }).save();
    const user = await new User({ username: 'testuser', password: 'pass' }).save();
    userId = user._id;

    const response = await request(app).put(`/user/${userId}/username`).send({ username: 'existinguser' });
    expect(response.status).toBe(400);
  });

  it('should update password on PUT /user/:id/password', async () => {
    const user = await new User({ username: 'testuser', password: await bcrypt.hash('testpassword', 10) }).save();
    userId = user._id;
    const response = await request(app).put(`/user/${userId}/password`).send({
      currentPassword: 'testpassword',
      newPassword: 'newpassword',
      confirmPassword: 'newpassword',
    });
    expect(response.status).toBe(200);

    const updatedUser = await User.findById(userId);
    const passwordMatches = await bcrypt.compare('newpassword', updatedUser.password);
    expect(passwordMatches).toBe(true);
  });

  it('should fail to update password if current password is wrong', async () => {
    const user = await new User({ username: 'testuser', password: await bcrypt.hash('testpassword', 10) }).save();
    userId = user._id;
    const response = await request(app).put(`/user/${userId}/password`).send({
      currentPassword: 'wrongpassword',
      newPassword: 'newpassword',
      confirmPassword: 'newpassword',
    });
    expect(response.status).toBe(400);
  });

  it('should upload profile picture on POST /user/:id/profile-pic', async () => {
    const user = await new User({ username: 'testuser', password: 'testpassword' }).save();
    userId = user._id;
    const response = await request(app)
      .post(`/user/${userId}/profile-pic`)
      .attach('profilePic', Buffer.from('testimagecontent'), 'profile.png');
    expect(response.status).toBe(200);
  });

  it('should get profile picture on GET /user/:id/profile-pic', async () => {
    const user = await new User({ username: 'testuser', password: 'testpassword' }).save();
    userId = user._id;

    const imagePath = path.join(__dirname, 'Uploads', 'profile_pics', `${userId}.png`);
    fs.mkdirSync(path.dirname(imagePath), { recursive: true });
    fs.writeFileSync(imagePath, 'testimagecontent');

    const response = await request(app).get(`/user/${userId}/profile-pic`);
    expect(response.status).toBe(200);
  });

  it('should delete profile picture on DELETE /user/:id/profile-pic', async () => {
    const user = await new User({ username: 'testuser', password: 'testpassword' }).save();
    userId = user._id;

    const imagePath = path.join(__dirname, 'Uploads', 'profile_pics', `${userId}.png`);
    fs.mkdirSync(path.dirname(imagePath), { recursive: true });
    fs.writeFileSync(imagePath, 'testimagecontent');

    const response = await request(app).delete(`/user/${userId}/profile-pic`);
    expect(response.status).toBe(200);
  });

  describe('GET /user/:id/profile-pic', () => {
    it('should get profile picture', async () => {
      const user = await new User({ username: 'testuser_unique1', password: 'pass' }).save();
      userId = user._id;

      const imagePath = path.join(__dirname, 'Uploads', 'profile_pics', `${userId}.png`);
      fs.mkdirSync(path.dirname(imagePath), { recursive: true });
      fs.writeFileSync(imagePath, 'testimagecontent');

      const response = await request(app).get(`/user/${userId}/profile-pic`);
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should return 404 if profile picture does not exist', async () => {
      const user = await new User({ username: 'testuser_unique2', password: 'pass' }).save();
      userId = user._id;

      const response = await request(app).get(`/user/${userId}/profile-pic`);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Profile picture not found');
    });

    it('should handle filesystem error', async () => {
      jest.spyOn(fs, 'access').mockImplementationOnce((path, mode, callback) => {
        callback(new Error('Filesystem error'));
      });

      const user = await new User({ username: 'testuser_unique3', password: 'pass' }).save();
      userId = user._id;

      const response = await request(app).get(`/user/${userId}/profile-pic`);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Profile picture not found');

      jest.spyOn(fs, 'access').mockRestore();
    });
  });

  describe('DELETE /user/:id/profile-pic', () => {
    it('should delete profile picture', async () => {
      const user = await new User({ username: 'testuser_unique4', password: 'pass' }).save();
      userId = user._id;

      const imagePath = path.join(__dirname, 'Uploads', 'profile_pics', `${userId}.png`);
      fs.mkdirSync(path.dirname(imagePath), { recursive: true });
      fs.writeFileSync(imagePath, 'testimagecontent');

      const response = await request(app).delete(`/user/${userId}/profile-pic`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Profile picture deleted successfully');

      const exists = fs.existsSync(imagePath);
      expect(exists).toBe(false);
    });

    it('should fail to delete non-existent profile picture', async () => {
      const user = await new User({ username: 'testuser_unique5', password: 'pass' }).save();
      userId = user._id;

      const response = await request(app).delete(`/user/${userId}/profile-pic`);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No profile picture to delete');
    });

    it('should handle filesystem error', async () => {
      jest.spyOn(fs, 'access').mockImplementationOnce((path, mode, callback) => {
        callback(new Error('Filesystem error'));
      });

      const user = await new User({ username: 'testuser_unique6', password: 'pass' }).save();
      userId = user._id;

      const response = await request(app).delete(`/user/${userId}/profile-pic`);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No profile picture to delete');

      jest.spyOn(fs, 'access').mockRestore();
    });
  });
});