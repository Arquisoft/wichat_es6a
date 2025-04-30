const request = require('supertest');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const {server, stopHealthCheckInterval} = require('./gateway-service'); 
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');

const mock = new MockAdapter(axios);

describe('Servicio Gateway', () => {
  const userServiceUrl = 'http://localhost:8001';
  const authServiceUrl = 'http://localhost:8002';
  const llmServiceUrl = 'http://localhost:8003';
  const historyServiceUrl = 'http://localhost:8010';
  const questionServiceUrl = 'http://localhost:8005';
  const wikidataServiceUrl = 'http://localhost:8020';

  

  afterEach(() => {
    mock.reset(); // Resetea los mocks después de cada prueba
  });

  afterAll(async () => {
    server.close();
    stopHealthCheckInterval();
  });

  // Endpoint de Salud
  describe('GET /health', () => {
    it('debería devolver el estado OK', async () => {
      const response = await request(server).get('/health');
      expect(response.status).toBe(200);
    });
  });

  // Endpoints del Servicio de Usuarios
  describe('Endpoints del Servicio de Usuarios', () => {
    describe('GET /user/:id', () => {
      it('debería devolver los datos del usuario para un ID válido', async () => {
        const userId = '123';
        const userData = { id: userId, username: 'testuser' };
        mock.onGet(`${userServiceUrl}/user/${userId}`).reply(200, userData);

        const response = await request(server).get(`/user/${userId}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(userData);
      });

      it('debería devolver 404 para un usuario inexistente', async () => {
        const userId = '999';
        mock.onGet(`${userServiceUrl}/user/${userId}`).reply(404, { error: 'Usuario no encontrado' });

        const response = await request(server).get(`/user/${userId}`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Usuario no encontrado' });
      });
    });

    describe('PUT /user/:id/username', () => {
      it('debería actualizar el nombre de usuario correctamente', async () => {
        const userId = '123';
        const newUsername = { username: 'nuevousuario' };
        mock.onPut(`${userServiceUrl}/user/${userId}/username`).reply(200, { success: true });

        const response = await request(server)
          .put(`/user/${userId}/username`)
          .send(newUsername);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
      });

      it('debería devolver 400 para un nombre de usuario inválido', async () => {
        const userId = '123';
        mock.onPut(`${userServiceUrl}/user/${userId}/username`).reply(400, { error: 'Nombre de usuario inválido' });

        const response = await request(server)
          .put(`/user/${userId}/username`)
          .send({ username: '' });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Nombre de usuario inválido' });
      });
    });

    describe('PUT /user/:id/password', () => {
      it('debería actualizar la contraseña correctamente', async () => {
        const userId = '123';
        const newPassword = { password: 'nuevacontraseña123' };
        mock.onPut(`${userServiceUrl}/user/${userId}/password`).reply(200, { success: true });

        const response = await request(server)
          .put(`/user/${userId}/password`)
          .send(newPassword);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
      });

      it('debería devolver 400 para una contraseña débil', async () => {
        const userId = '123';
        mock.onPut(`${userServiceUrl}/user/${userId}/password`).reply(400, { error: 'Contraseña demasiado débil' });

        const response = await request(server)
          .put(`/user/${userId}/password`)
          .send({ password: 'débil' });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Contraseña demasiado débil' });
      });
    });

    describe('POST /user/:id/profile-pic', () => {
      it('debería subir la foto de perfil correctamente', async () => {
        const userId = '123';
        mock.onPost(`${userServiceUrl}/user/${userId}/profile-pic`).reply(200, { success: true });

        const response = await request(server)
          .post(`/user/${userId}/profile-pic`)
          .attach('file', Buffer.from('test'), 'test.jpg');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
      });

      it('debería devolver 400 para un archivo inválido', async () => {
        const userId = '123';
        mock.onPost(`${userServiceUrl}/user/${userId}/profile-pic`).reply(400, { error: 'Formato de archivo inválido' });

        const response = await request(server)
          .post(`/user/${userId}/profile-pic`)
          .send({});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Formato de archivo inválido' });
      });
    });

    describe('GET /user/:id/profile-pic', () => {
      it('debería transmitir la foto de perfil correctamente', async () => {
        const userId = '123';
        
        // Crear un stream simulando la imagen
        const fakeImageData = 'datos-imagen';
        const stream = new Readable();
        stream.push(fakeImageData);
        stream.push(null); // Señala fin del stream
    
        mock.onGet(`${userServiceUrl}/user/${userId}/profile-pic`).reply(() => {
          return [200, stream, { 'content-type': 'image/jpeg' }];
        });
    
        const response = await request(server)
          .get(`/user/${userId}/profile-pic`)
          .buffer()
          .parse((res, callback) => {
            res.setEncoding('utf8'); // o 'binary' si estás esperando binarios reales
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => callback(null, data));
          });
    
        expect(response.status).toBe(200);
      });

      it('debería devolver 404 si la foto de perfil no se encuentra', async () => {
        const userId = '123';
        mock.onGet(`${userServiceUrl}/user/${userId}/profile-pic`).reply(404, { error: 'Foto de perfil no encontrada' });

        const response = await request(server).get(`/user/${userId}/profile-pic`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Foto de perfil no encontrada' });
      });
    });

    describe('DELETE /user/:id/profile-pic', () => {
      it('debería eliminar la foto de perfil correctamente', async () => {
        const userId = '123';
        mock.onDelete(`${userServiceUrl}/user/${userId}/profile-pic`).reply(200, { success: true });

        const response = await request(server).delete(`/user/${userId}/profile-pic`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
      });

      it('debería devolver 404 si la foto de perfil no se encuentra', async () => {
        const userId = '123';
        mock.onDelete(`${userServiceUrl}/user/${userId}/profile-pic`).reply(404, { error: 'Foto de perfil no encontrada' });

        const response = await request(server).delete(`/user/${userId}/profile-pic`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Foto de perfil no encontrada' });
      });
    });

    describe('POST /adduser', () => {
      it('debería crear un usuario correctamente', async () => {
        const userData = { username: 'nuevousuario', password: 'contraseña123' };
        mock.onPost(`${userServiceUrl}/adduser`).reply(200, { id: '123', ...userData });

        const response = await request(server).post('/adduser').send(userData);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ id: '123', ...userData });
      });

      it('debería devolver 400 para datos de usuario inválidos', async () => {
        mock.onPost(`${userServiceUrl}/adduser`).reply(400, { error: 'Datos de usuario inválidos' });

        const response = await request(server).post('/adduser').send({ username: '' });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Datos de usuario inválidos' });
      });
    });
  });

  // Endpoints del Servicio de Autenticación
  describe('Endpoints del Servicio de Autenticación', () => {
    describe('POST /login', () => {
      it('debería autenticar al usuario correctamente', async () => {
        const loginData = { username: 'testuser', password: 'contraseña123' };
        mock.onPost(`${authServiceUrl}/login`).reply(200, { token: 'mockedToken' });

        const response = await request(server).post('/login').send(loginData);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ token: 'mockedToken' });
      });

      it('debería devolver 401 para credenciales inválidas', async () => {
        mock.onPost(`${authServiceUrl}/login`).reply(401, { error: 'Credenciales inválidas' });

        const response = await request(server).post('/login').send({ username: 'testuser', password: 'incorrecta' });
        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Credenciales inválidas' });
      });
    });
  });

  // Endpoints del Servicio de LLM
  describe('Endpoints del Servicio de LLM', () => {
    describe('POST /generateQuestions', () => {
      it('debería generar preguntas correctamente', async () => {
        const questionData = { topic: 'historia' };
        mock.onPost(`${llmServiceUrl}/generateQuestions`).reply(200, { questions: ['pregunta1', 'pregunta2'] });

        const response = await request(server).post('/generateQuestions').send(questionData);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ questions: ['pregunta1', 'pregunta2'] });
      });

      it('debería devolver 400 para datos inválidos', async () => {
        mock.onPost(`${llmServiceUrl}/generateQuestions`).reply(400, { error: 'Datos inválidos' });

        const response = await request(server).post('/generateQuestions').send({});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Datos inválidos' });
      });
    });

    describe('POST /configureAssistant', () => {
      it('debería configurar el asistente correctamente', async () => {
        const configData = { model: 'gemini' };
        mock.onPost(`${llmServiceUrl}/configureAssistant`).reply(200, { success: true });

        const response = await request(server).post('/configureAssistant').send(configData);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
      });

      it('debería devolver 400 para configuración inválida', async () => {
        mock.onPost(`${llmServiceUrl}/configureAssistant`).reply(400, { error: 'Configuración inválida' });

        const response = await request(server).post('/configureAssistant').send({});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Configuración inválida' });
      });
    });

    describe('POST /ask', () => {
      it('debería responder a una pregunta correctamente', async () => {
        const questionData = { question: '¿Qué es la gravedad?' };
        mock.onPost(`${llmServiceUrl}/ask`).reply(200, { answer: 'La gravedad es...' });

        const response = await request(server).post('/ask').send(questionData);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ answer: 'La gravedad es...' });
      });

      it('debería devolver 400 para pregunta inválida', async () => {
        mock.onPost(`${llmServiceUrl}/ask`).reply(400, { error: 'Pregunta inválida' });

        const response = await request(server).post('/ask').send({ question: '' });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Pregunta inválida' });
      });
    });

    describe('POST /getHint', () => {
      it('debería devolver una pista correctamente', async () => {
        const hintData = { questionId: '123' };
        mock.onPost(`${llmServiceUrl}/getHint`).reply(200, { hint: 'Pista útil' });

        const response = await request(server).post('/getHint').send(hintData);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ hint: 'Pista útil' });
      });

      it('debería devolver 400 para datos inválidos', async () => {
        mock.onPost(`${llmServiceUrl}/getHint`).reply(400, { error: 'Datos inválidos' });

        const response = await request(server).post('/getHint').send({});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Datos inválidos' });
      });
    });

    describe('POST /getHintWithQuery', () => {
      it('debería devolver una pista con consulta correctamente', async () => {
        const hintData = { query: 'capital de Francia' };
        mock.onPost(`${llmServiceUrl}/getHintWithQuery`).reply(200, { hint: 'Es una ciudad famosa' });

        const response = await request(server).post('/getHintWithQuery').send(hintData);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ hint: 'Es una ciudad famosa' });
      });

      it('debería devolver 400 para consulta inválida', async () => {
        mock.onPost(`${llmServiceUrl}/getHintWithQuery`).reply(400, { error: 'Consulta inválida' });

        const response = await request(server).post('/getHintWithQuery').send({ query: '' });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Consulta inválida' });
      });
    });
  });

  // Endpoints del Servicio de Historial de Partidas
  describe('Endpoints del Servicio de Historial de Partidas', () => {
    describe('GET /getBestGames', () => {
      it('debería devolver las mejores partidas correctamente', async () => {
        const username = 'testuser';
        mock.onGet(`${historyServiceUrl}/getBestGames`).reply(200, { games: [{ id: '1', score: 100 }] });

        const response = await request(server)
          .get('/getBestGames')
          .set('username', username);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ games: [{ id: '1', score: 100 }] });
      });

      it('debería devolver 404 si no hay partidas', async () => {
        const username = 'testuser';
        mock.onGet(`${historyServiceUrl}/getBestGames`).reply(404, { error: 'No se encontraron partidas' });

        const response = await request(server)
          .get('/getBestGames')
          .set('username', username);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron partidas' });
      });
    });

    describe('GET /getAllGames', () => {
      it('debería devolver todas las partidas correctamente', async () => {
        const username = 'testuser';
        mock.onGet(`${historyServiceUrl}/getAllGames`).reply(200, { games: [{ id: '1' }, { id: '2' }] });

        const response = await request(server)
          .get('/getAllGames')
          .set('username', username);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ games: [{ id: '1' }, { id: '2' }] });
      });

      it('debería devolver 404 si no hay partidas', async () => {
        const username = 'testuser';
        mock.onGet(`${historyServiceUrl}/getAllGames`).reply(404, { error: 'No se encontraron partidas' });

        const response = await request(server)
          .get('/getAllGames')
          .set('username', username);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron partidas' });
      });
    });

    describe('GET /stats', () => {
      it('debería devolver estadísticas correctamente', async () => {
        const username = 'testuser';
        mock.onGet(`${historyServiceUrl}/stats`).reply(200, { stats: { totalGames: 10, averageScore: 80 } });

        const response = await request(server)
          .get('/stats')
          .set('username', username);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ stats: { totalGames: 10, averageScore: 80 } });
      });

      it('debería devolver 404 si no hay estadísticas', async () => {
        const username = 'testuser';
        mock.onGet(`${historyServiceUrl}/stats`).reply(404, { error: 'No se encontraron estadísticas' });

        const response = await request(server)
          .get('/stats')
          .set('username', username);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron estadísticas' });
      });
    });

    describe('POST /addGame', () => {
      it('debería agregar una partida correctamente', async () => {
        const gameData = { score: 100, date: '2023-10-01' };
        mock.onPost(`${historyServiceUrl}/addGame`).reply(201, { id: '123', ...gameData });

        const response = await request(server).post('/addGame').send(gameData);
        expect(response.status).toBe(201);
        expect(response.body).toEqual({ id: '123', ...gameData });
      });

      it('debería devolver 400 para datos de partida inválidos', async () => {
        mock.onPost(`${historyServiceUrl}/addGame`).reply(400, { error: 'Datos de partida inválidos' });

        const response = await request(server).post('/addGame').send({});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Datos de partida inválidos' });
      });
    });
  });

  // Endpoints del Servicio de Preguntas
  describe('Endpoints del Servicio de Preguntas', () => {
    describe('POST /addQuestion', () => {
      it('debería agregar una pregunta correctamente', async () => {
        const questionData = { question: '¿Cuál es la capital de Francia?', answer: 'París' };
        mock.onPost(`${questionServiceUrl}/addQuestion`).reply(201, { id: '123', ...questionData });

        const response = await request(server).post('/addQuestion').send(questionData);
        expect(response.status).toBe(201);
        expect(response.body).toEqual({ id: '123', ...questionData });
      });

      it('debería devolver 400 para pregunta inválida', async () => {
        mock.onPost(`${questionServiceUrl}/addQuestion`).reply(400, { error: 'Pregunta inválida' });

        const response = await request(server).post('/addQuestion').send({ question: '' });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Pregunta inválida' });
      });
    });

    describe('GET /questions', () => {
      it('debería devolver todas las preguntas correctamente', async () => {
        mock.onGet(`${questionServiceUrl}/questions`).reply(200, { questions: [{ id: '1', question: 'Pregunta 1' }] });

        const response = await request(server).get('/questions');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ questions: [{ id: '1', question: 'Pregunta 1' }] });
      });

      it('debería devolver 404 si no hay preguntas', async () => {
        mock.onGet(`${questionServiceUrl}/questions`).reply(404, { error: 'No se encontraron preguntas' });

        const response = await request(server).get('/questions');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No se encontraron preguntas' });
      });
    });
  });

  // Endpoints del Servicio de Wikidata
  describe('Endpoints del Servicio de Wikidata', () => {
    describe('GET /api/entries/random', () => {
      it('debería devolver una entrada aleatoria correctamente', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/entries/random`).reply(200, { entry: { id: 'Q123', name: 'Entrada' } });

        const response = await request(server).get('/api/entries/random');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ entry: { id: 'Q123', name: 'Entrada' } });
      });

      it('debería devolver 500 si el servicio falla', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/entries/random`).reply(500, { error: 'Error del servidor' });

        const response = await request(server).get('/api/entries/random');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
      });
    });

    describe('GET /api/entries/:category', () => {
      it('debería devolver entradas de una categoría correctamente', async () => {
        const category = 'paises';
        mock.onGet(`${wikidataServiceUrl}/api/entries/${category}`).reply(200, { entries: [{ id: 'Q1', name: 'País' }] });

        const response = await request(server).get(`/api/entries/${category}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ entries: [{ id: 'Q1', name: 'País' }] });
      });

      it('debería devolver 404 para categoría inválida', async () => {
        const category = 'invalida';
        mock.onGet(`${wikidataServiceUrl}/api/entries/${category}`).reply(404, { error: 'Categoría no encontrada' });

        const response = await request(server).get(`/api/entries/${category}`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Categoría no encontrada' });
      });
    });

    describe('POST /api/entries/fetch/:category', () => {
      it('debería obtener entradas de una categoría correctamente', async () => {
        const category = 'paises';
        const fetchData = { limit: 10 };
        mock.onPost(`${wikidataServiceUrl}/api/entries/fetch/${category}`).reply(200, { entries: [{ id: 'Q1', name: 'País' }] });

        const response = await request(server)
          .post(`/api/entries/fetch/${category}`)
          .send(fetchData);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ entries: [{ id: 'Q1', name: 'País' }] });
      });

      it('debería devolver 400 para datos inválidos', async () => {
        const category = 'paises';
        mock.onPost(`${wikidataServiceUrl}/api/entries/fetch/${category}`).reply(400, { error: 'Datos inválidos' });

        const response = await request(server)
          .post(`/api/entries/fetch/${category}`)
          .send({});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Datos inválidos' });
      });
    });

    describe('GET /api/paises', () => {
      it('debería devolver países correctamente', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/paises`).reply(200, { countries: [{ id: 'Q1', name: 'País' }] });

        const response = await request(server).get('/api/paises');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ countries: [{ id: 'Q1', name: 'País' }] });
      });

      it('debería devolver 500 si el servicio falla', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/paises`).reply(500, { error: 'Error del servidor' });

        const response = await request(server).get('/api/paises');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
      });
    });

    describe('GET /api/monumentos', () => {
      it('debería devolver monumentos correctamente', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/monumentos`).reply(200, { monuments: [{ id: 'Q2', name: 'Monumento' }] });

        const response = await request(server).get('/api/monumentos');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ monuments: [{ id: 'Q2', name: 'Monumento' }] });
      });

      it('debería devolver 500 si el servicio falla', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/monumentos`).reply(500, { error: 'Error del servidor' });

        const response = await request(server).get('/api/monumentos');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
      });
    });

    describe('GET /api/elementos', () => {
      it('debería devolver elementos correctamente', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/elementos`).reply(200, { elements: [{ id: 'Q3', name: 'Elemento' }] });

        const response = await request(server).get('/api/elementos');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ elements: [{ id: 'Q3', name: 'Elemento' }] });
      });

      it('debería devolver 500 si el servicio falla', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/elementos`).reply(500, { error: 'Error del servidor' });

        const response = await request(server).get('/api/elementos');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
      });
    });

    describe('GET /api/peliculas', () => {
      it('debería devolver películas correctamente', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/peliculas`).reply(200, { movies: [{ id: 'Q4', name: 'Película' }] });

        const response = await request(server).get('/api/peliculas');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ movies: [{ id: 'Q4', name: 'Película' }] });
      });

      it('debería devolver 500 si el servicio falla', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/peliculas`).reply(500, { error: 'Error del servidor' });

        const response = await request(server).get('/api/peliculas');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
      });
    });

    describe('GET /api/canciones', () => {
      it('debería devolver canciones correctamente', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/canciones`).reply(200, { songs: [{ id: 'Q5', name: 'Canción' }] });

        const response = await request(server).get('/api/canciones');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ songs: [{ id: 'Q5', name: 'Canción' }] });
      });

      it('debería devolver 500 si el servicio falla', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/canciones`).reply(500, { error: 'Error del servidor' });

        const response = await request(server).get('/api/canciones');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
      });
    });

    describe('GET /api/formula1', () => {
      it('debería devolver datos de Fórmula 1 correctamente', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/formula1`).reply(200, { formula1: [{ id: 'Q6', name: 'Piloto' }] });

        const response = await request(server).get('/api/formula1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ formula1: [{ id: 'Q6', name: 'Piloto' }] });
      });

      it('debería devolver 500 si el servicio falla', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/formula1`).reply(500, { error: 'Error del servidor' });

        const response = await request(server).get('/api/formula1');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
      });
    });

    describe('GET /api/pinturas', () => {
      it('debería devolver pinturas correctamente', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/pinturas`).reply(200, { paintings: [{ id: 'Q7', name: 'Pintura' }] });

        const response = await request(server).get('/api/pinturas');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ paintings: [{ id: 'Q7', name: 'Pintura' }] });
      });

      it('debería devolver 500 si el servicio falla', async () => {
        mock.onGet(`${wikidataServiceUrl}/api/pinturas`).reply(500, { error: 'Error del servidor' });

        const response = await request(server).get('/api/pinturas');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error del servidor' });
      });
    });
  });
});