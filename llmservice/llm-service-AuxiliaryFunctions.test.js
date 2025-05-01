const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const {
  server,
  validateRequiredFields,
  sendQuestionToLLM,
  parseJsonResponse,
  getWikidataForCategory,
  getWikidataRandomEntry,
  getMultipleRandomEntries,
  formatEntryInfo,
  generateQuestionForEntry,
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
  });




});