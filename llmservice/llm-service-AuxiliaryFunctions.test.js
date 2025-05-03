const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const {
  server,
  validateRequiredFields,
  sendQuestionToLLM,
  parseJsonResponse,
  getWikidataForCategory,
  getWikidataRandomEntry,
  formatEntryInfo,
} = require('./llm-service');

jest.mock('./llm-service', () => ({
  ...jest.requireActual('./llm-service'),
  sendQuestionToLLM: jest.fn(),
  parseJsonResponse: jest.fn(),
  getWikidataRandomEntry: jest.fn(),
}));

describe('LLM Service Functions', () => {
  let mock;


  beforeEach(() => {
    mock = new MockAdapter(axios);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    sendQuestionToLLM.mockReset();
    parseJsonResponse.mockReset();
    getWikidataRandomEntry.mockReset();
  });

  afterEach(() => {
    mock.restore();
    console.error.mockRestore();
    console.log.mockRestore();
  });

  afterAll(() => {
    server.close();
    });

  // Tests for validateRequiredFields
  describe('validateRequiredFields', () => {
    test('should pass with all required fields present', () => {
      const req = { body: { name: 'John', age: 30 } };
      const requiredFields = ['name', 'age'];
      expect(() => validateRequiredFields(req, requiredFields)).not.toThrow();
    });

    test('should pass with valid zero or false values', () => {
      const req = { body: { count: 0, active: false } };
      const requiredFields = ['count', 'active'];
      expect(() => validateRequiredFields(req, requiredFields)).not.toThrow();
    });

    test('should throw if a required field is missing', () => {
      const req = { body: { name: 'John' } };
      const requiredFields = ['name', 'age'];
      expect(() => validateRequiredFields(req, requiredFields)).toThrow(
        'Missing or invalid required field: age'
      );
    });

    test('should throw if a required array field is empty', () => {
      const req = { body: { questions: [], answers: ['a'] } };
      const requiredFields = ['questions', 'answers'];
      expect(() => validateRequiredFields(req, requiredFields)).toThrow(
        "Required array field 'questions' cannot be empty."
      );
    });
  });

  // Tests for getWikidataForCategory
  describe('getWikidataForCategory', () => {
    test('should return single entry for count=1', async () => {
      const mockResponse = [{ id: 'Q123', label: 'France', imageUrl: 'france.jpg' }];
      mock.onGet(/entries\/paises/).reply(200, mockResponse);

      const result = await getWikidataForCategory('paises', 1);
      expect(result).toEqual(mockResponse[0]);
    });

    test('should return multiple entries for count>1', async () => {
      const mockResponse = [
        { id: 'Q123', label: 'France', imageUrl: 'france.jpg' },
        { id: 'Q124', label: 'Spain', imageUrl: 'spain.jpg' },
      ];
      mock.onGet(/entries\/paises/).reply(200, mockResponse);

      const result = await getWikidataForCategory('paises', 2);
      expect(result).toEqual(mockResponse);
    });

    test('should return null on error', async () => {
      mock.onGet(/entries\/paises/).reply(500);

      const result = await getWikidataForCategory('paises');
      expect(result).toBeNull();
    });
  });

  // Tests for formatEntryInfo
  describe('formatEntryInfo', () => {
    // Existing tests remain unchanged
    test('should format country entry', () => {
      const entry = {
        data: { category: 'paises', countryLabel: 'France', capitalLabel: 'Paris' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('País: France, Capital: Paris');
    });
  
    test('should format monument entry', () => {
      const entry = {
        data: { category: 'monumentos', monumentLabel: 'Eiffel Tower', countryLabel: 'France' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Monumento: Eiffel Tower, País: France');
    });
  
    test('should handle missing fields', () => {
      const entry = { data: { category: 'paises', countryLabel: 'France' } };
      const result = formatEntryInfo(entry);
      expect(result).toBe('País: France');
    });
  
    test('should return empty string for invalid entry', () => {
      const entry = {};
      const result = formatEntryInfo(entry);
      expect(result).toBe('');
    });
  
    // New tests for 100% coverage
    test('should format elementos entry', () => {
      const entry = {
        data: { category: 'elementos', elementLabel: 'Hydrogen', symbol: 'H' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Elemento: Hydrogen, Símbolo: H');
    });
  
    test('should format elementos entry with missing symbol', () => {
      const entry = {
        data: { category: 'elementos', elementLabel: 'Hydrogen' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Elemento: Hydrogen');
    });
  
    test('should format peliculas entry', () => {
      const entry = {
        data: { category: 'peliculas', peliculaLabel: 'Inception', directorLabel: 'Nolan' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Película: Inception, Director: Nolan');
    });
  
    test('should format peliculas entry with missing director', () => {
      const entry = {
        data: { category: 'peliculas', peliculaLabel: 'Inception' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Película: Inception');
    });
  
    test('should format canciones entry', () => {
      const entry = {
        data: { category: 'canciones', songLabel: 'Bohemian Rhapsody', artistLabel: 'Queen' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Canción: Bohemian Rhapsody, Artista: Queen');
    });
  
    test('should format canciones entry with missing artist', () => {
      const entry = {
        data: { category: 'canciones', songLabel: 'Bohemian Rhapsody' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Canción: Bohemian Rhapsody');
    });
  
    test('should format formula1 entry', () => {
      const entry = {
        data: { category: 'formula1', year: '2020', winnerLabel: 'Hamilton' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Campeonato F1 Año: 2020, Ganador: Hamilton');
    });
  
    test('should format formula1 entry with missing winner', () => {
      const entry = {
        data: { category: 'formula1', year: '2020' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Campeonato F1 Año: 2020');
    });
  
    test('should format pinturas entry', () => {
      const entry = {
        data: { category: 'pinturas', paintingLabel: 'Mona Lisa', artistLabel: 'Da Vinci' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Pintura: Mona Lisa, Autor: Da Vinci');
    });
  
    test('should format pinturas entry with missing artist', () => {
      const entry = {
        data: { category: 'pinturas', paintingLabel: 'Mona Lisa' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Pintura: Mona Lisa');
    });
  
    test('should format default entry with label', () => {
      const entry = {
        data: { category: 'unknown', label: 'Generic Concept' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Concepto: Generic Concept');
    });
  
    test('should format default entry with itemLabel', () => {
      const entry = {
        data: { category: 'unknown', itemLabel: 'Generic Item' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Concepto: Generic Item');
    });
  
    test('should format default entry as unknown when no label', () => {
      const entry = {
        data: { category: 'unknown' },
      };
      const result = formatEntryInfo(entry);
      expect(result).toBe('Concepto: Desconocido');
    });
  
    test('should return empty string for null entry', () => {
      const result = formatEntryInfo(null);
      expect(result).toBe('');
    });
  
    test('should return empty string for undefined entry', () => {
      const result = formatEntryInfo(undefined);
      expect(result).toBe('');
    });
  });
});