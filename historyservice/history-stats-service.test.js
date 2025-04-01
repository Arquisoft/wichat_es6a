const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./app'); 
const User = require("./llmservice/models/user-model.js")(mongoose);
const History = require("./llmservice/models/history-model.js")(mongoose);

// Mock de los modelos
jest.mock('./llmservice/models/user-model');
jest.mock('./llmservice/models/history-model');

describe("History Service - /stats", () => {
  
  // Test para verificar el estado 200 cuando los datos son correctos
  it('should return 200 and the correct user stats', async () => {
    // Datos simulados para un usuario y su historial
    const mockUser = {
      username: 'testuser1',
    };

    const mockHistory = [
      { gameId: 1, score: 60, recordedAt: new Date() },
      { gameId: 2, score: 40, recordedAt: new Date() },
      { gameId: 3, score: 75, recordedAt: new Date() },
    ];

    // Simula la respuesta de la base de datos
    User.findOne.mockResolvedValue(mockUser);
    History.find.mockResolvedValue(mockHistory);

    // Enviar la solicitud y verificar la respuesta
    const response = await request(app).get("/stats");

    expect(response.statusCode).toBe(200);
    expect(response.body.username).toBe('testuser1');
    expect(response.body.gamesPlayed).toBe(3);
    expect(response.body.totalPoints).toBe(175);
    expect(response.body.pointsPerGame).toBeCloseTo(58.33, 2);
    expect(response.body.wins).toBe(2);
    expect(response.body.losses).toBe(1);
    expect(response.body.bestGames.length).toBe(3);
  });

  // Test para verificar el estado 404 si el usuario no se encuentra
  it('should return 404 if user is not found', async () => {
    // Simula que el usuario no existe
    User.findOne.mockResolvedValue(null);

    const response = await request(app).get("/stats");

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  // Test para verificar el estado 500 si hay un error en la base de datos
  it('should return 500 if there is a database error', async () => {
    // Simula un error en la base de datos
    User.findOne.mockRejectedValue(new Error('Database error'));
    
    const response = await request(app).get("/stats");

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Error fetching stats");
  });
});

