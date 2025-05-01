// mm.test.js

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { server, getWikidataRandomEntry, getMultipleRandomEntries } = require('./llm-service'); 

// Crea un mock para axios
const mockAxios = new MockAdapter(axios);

describe('LLM Service Functions', () => {
  afterEach(() => {
    mockAxios.reset(); // Resetea el mock después de cada test
  });

  afterAll(() => {
    server.close();
  });

  describe('getWikidataRandomEntry', () => {
    test('should return random entry', async () => {
      const mockResponse = { id: 'Q123', label: 'France', imageUrl: 'france.jpg' };

      // Simula la respuesta exitosa
      mockAxios.onGet(/entries\/random/).reply(200, mockResponse);

      const result = await getWikidataRandomEntry();
      // Verifica que el resultado tenga los campos requeridos
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('imageUrl');
    });

    test('should return null on error', async () => {
      // Simula un error (status 500)
      mockAxios.onGet(/entries\/random/).reply(500);

      const result = await getWikidataRandomEntry();
      expect(result).toBeNull();
    });
  });

  describe('getMultipleRandomEntries', () => {
    test('should return multiple valid entries', async () => {
      const mockEntries = [
        { id: 'Q1', label: 'France', imageUrl: 'france.jpg' },
        { id: 'Q2', label: 'Spain', imageUrl: 'spain.jpg' },
      ];

      // Configura el mock para retornar dos entradas
      mockAxios.onGet(/entries\/random/).reply(200, mockEntries[0])
                .onGet(/entries\/random/).reply(200, mockEntries[1]);

      const result = await getMultipleRandomEntries(2);

      // Verifica que cada entrada tenga los campos requeridos
      result.forEach(entry => {
        expect(entry.data).toHaveProperty('id');
        expect(entry.data).toHaveProperty('label');
        expect(entry.data).toHaveProperty('imageUrl');
      });
    });

    test('should return empty array when all entries fail', async () => {
      // Simula que todas las respuestas fallan
      mockAxios.onGet(/entries\/random/).reply(500)
                .onGet(/entries\/random/).reply(500);

      const result = await getMultipleRandomEntries(2);
      expect(result).toEqual([]); // Verifica que la respuesta sea un array vacío
    });
  });
});
