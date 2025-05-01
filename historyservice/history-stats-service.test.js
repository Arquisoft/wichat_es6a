const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Mock del modelo UserGame
jest.mock('../llmservice/models/history-model', () => {
  const mockModel = function (data) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue(data), // save sigue simulando el éxito
    };
  };

  // Mock de los métodos estáticos
  mockModel.find = jest.fn();
  mockModel.create = jest.fn(); // Aquí dejamos el mock vacío, será sobrescrito en cada test

  return () => mockModel;
});

// Mock de la conexión a la base de datos
jest.mock('../llmservice/config/database', () => jest.fn());

const UserGame = require('../llmservice/models/history-model')(mongoose);

// Importar el app exportado del servicio
const app = require('./history-stats-service'); // Ajusta la ruta al archivo de tu servicio

// Datos de prueba
const mockGames = [
  {
    username: 'testuser',
    gameId: 'game1',
    score: 100,
    recordedAt: new Date('2023-01-01'),
    category: 'Trivia',
    timeTaken: 300,
    totalQuestions: 10,
    correctQuestions: 8,
    difficulty: 'Fácil',
  },
  {
    username: 'testuser',
    gameId: 'game2',
    score: 150,
    recordedAt: new Date('2023-01-02'),
    category: 'Matemáticas',
    timeTaken: 400,
    totalQuestions: 10,
    correctQuestions: 9,
    difficulty: 'Medio',
  },
  {
    username: 'testuser',
    gameId: 'game3',
    score: 50,
    recordedAt: new Date('2023-01-03'),
    category: 'Trivia',
    timeTaken: 200,
    totalQuestions: 10,
    correctQuestions: 5,
    difficulty: 'Difícil',
  },
];

// Datos válidos para /addGame
const validGame = {
  username: 'testuser',
  score: 100,
  correctQuestions: 8,
  gameId: 'game4',
  category: 'Trivia',
  timeTaken: 300,
  totalQuestions: 10,
  difficulty: 'Fácil',
};

// Datos inválidos (campos faltantes)
const missingFieldsGame = {
  username: 'testuser',
  gameId: 'game4',
};

// Datos inválidos (valores negativos)
const invalidGame = {
  username: 'testuser',
  score: -100,
  correctQuestions: 8,
  gameId: 'game4',
  category: 'Trivia',
  timeTaken: 300,
  totalQuestions: 10,
  difficulty: 'Fácil',
};

// Configuración de la aplicación Express
beforeAll(async () => {
  // Configurar middleware (por si el servicio no los configura en las pruebas)
  app.use(express.json());
  app.use(cors({
    origin: 'http://localhost:3000',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization,username',
  }));
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Servicio de Historial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /getBestGames', () => {
    it('Debe devolver las 3 mejores partidas para un usuario válido', async () => {
      UserGame.find.mockResolvedValue(mockGames);

      const response = await request(app)
        .get('/getBestGames')
        .set('username', 'testuser');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('id', 'game2');
      expect(response.body[0]).toHaveProperty('points', 150);
    });

    it('Debe devolver 400 si falta el nombre de usuario', async () => {
      const response = await request(app).get('/getBestGames');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username is required');
    });

    it('Debe devolver un arreglo vacío si no se encuentran partidas', async () => {
      UserGame.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/getBestGames')
        .set('username', 'testuser');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('Debe devolver 500 en caso de error interno', async () => {
      UserGame.find.mockRejectedValue(new Error('Error en la base de datos'));

      const response = await request(app)
        .get('/getBestGames')
        .set('username', 'testuser');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching best games');
    });
  });

  describe('GET /getAllGames', () => {
    it('Debe devolver todas las partidas para un usuario válido', async () => {
      UserGame.find.mockResolvedValue(mockGames);

      const response = await request(app)
        .get('/getAllGames')
        .set('username', 'testuser');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('id', 'game2');
    });

    it('Debe devolver 400 si falta el nombre de usuario', async () => {
      const response = await request(app).get('/getAllGames');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username is required');
    });

    it('Debe devolver un arreglo vacío si no se encuentran partidas', async () => {
      UserGame.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/getAllGames')
        .set('username', 'testuser');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('Debe devolver 500 en caso de error interno', async () => {
      UserGame.find.mockRejectedValue(new Error('Error en la base de datos'));

      const response = await request(app)
        .get('/getAllGames')
        .set('username', 'testuser');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching all games');
    });
  });

  describe('GET /stats', () => {
    it('Debe devolver estadísticas para un usuario válido', async () => {
      UserGame.find.mockResolvedValue(mockGames);

      const response = await request(app)
        .get('/stats')
        .set('username', 'testuser');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('gamesPlayed', 3);
      expect(response.body).toHaveProperty('totalPoints', 300);
    });

    it('Debe devolver 400 si falta el nombre de usuario', async () => {
      const response = await request(app).get('/stats');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username is required');
    });

    it('Debe devolver estadísticas predeterminadas si no se encuentran partidas', async () => {
      UserGame.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/stats')
        .set('username', 'testuser');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('gamesPlayed', 0);
      expect(response.body).toHaveProperty('totalPoints', 0);
      expect(response.body).toHaveProperty('mostPlayedCategory', 'Sin categoría');
    });

    it('Debe devolver 500 en caso de error interno', async () => {
      UserGame.find.mockRejectedValue(new Error('Error en la base de datos'));

      const response = await request(app)
        .get('/stats')
        .set('username', 'testuser');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching stats');
    });
  });

  describe('POST /addGame', () => {
    it('Debe agregar una nueva partida correctamente', async () => {
      // Simulamos que el método create retorna la partida
      UserGame.create.mockResolvedValue({
        ...validGame,
        recordedAt: new Date(),
      });

      const response = await request(app)
        .post('/addGame')
        .send(validGame);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Game successfully added');
      expect(response.body.game).toHaveProperty('username', 'testuser');
      expect(response.body.game).toHaveProperty('score', 100);
    });

    it('Debe devolver 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/addGame')
        .send(missingFieldsGame);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.errors).toContain('score is required');
    });

    it('Debe devolver 400 si el puntaje es negativo', async () => {
      const response = await request(app)
        .post('/addGame')
        .send(invalidGame);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.errors).toContain('Score cannot be negative');
    });
      
  });
});
