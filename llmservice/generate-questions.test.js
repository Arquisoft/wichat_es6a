// Mock de dependencias externas
jest.mock('path', () => ({
    resolve: jest.fn(() => '/mocked/path/to/.env'),
  }));
  
  jest.mock('dotenv', () => ({
    config: jest.fn(() => {
      process.env.LLM_API_KEY = 'mocked-api-key';
    }),
  }));
  
  jest.mock('../llmservice/llm-service', () => ({
    getWikidataForCategory: jest.fn(),
    generateQuestionForEntry: jest.fn(),
  }));
  
  // Importar mocks
  const path = require('path');
  const dotenv = require('dotenv');
  const { getWikidataForCategory, generateQuestionForEntry } = require('../llmservice/llm-service');
  
  // Mock de console
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  
  describe('generateQuestions Script', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.LLM_API_KEY = undefined;
    });
  
    // Prueba 1: Carga de dotenv y path
    test('loads dotenv with correct path', (done) => {
      getWikidataForCategory.mockResolvedValue({ id: 'Qmock1', name: 'Mock Entry' });
      generateQuestionForEntry.mockResolvedValue('Mock question?');
  
      jest.isolateModules(() => {
        require('./scripts/generate-questions');
        setImmediate(() => {
          expect(path.resolve).toHaveBeenCalledWith(expect.any(String), '../llmservice/.env');
          expect(dotenv.config).toHaveBeenCalledWith({ path: '/mocked/path/to/.env' });
          expect(process.env.LLM_API_KEY).toBe('mocked-api-key');
          done();
        });
      });
    });
  
    // Prueba 2: Generación de 2 preguntas por categoría
    test('generates 2 questions per category', (done) => {
      getWikidataForCategory.mockImplementation(async (category) => ({
        id: `Q${category}1`,
        name: `${category} Entry`,
      }));
      generateQuestionForEntry.mockImplementation(async (entry) => `Question for ${entry.data.name}?`);
  
      jest.isolateModules(() => {
        require('./scripts/generate-questions');
        setImmediate(() => {
          expect(getWikidataForCategory).toHaveBeenCalledTimes(14);
          expect(generateQuestionForEntry).toHaveBeenCalledTimes(14);
          expect(getWikidataForCategory).toHaveBeenCalledWith('paises', 1);
          expect(generateQuestionForEntry).toHaveBeenCalledWith(
            { data: { id: 'Qpaises1', name: 'paises Entry' } },
            'mocked-api-key'
          );
          expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Category: paises'));
          expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Generated question: Question for paises Entry?'));
          expect(console.log).toHaveBeenCalledWith('Ended generation of questions');
          done();
        });
      });
    });
  
    // Prueba 3: Manejo de categorías sin datos
    test('handles categories with no data', (done) => {
      getWikidataForCategory.mockImplementation(async (category) => {
        if (category === 'paises') return null;
        return { id: `Q${category}1`, name: `${category} Entry` };
      });
      generateQuestionForEntry.mockImplementation(async (entry) => `Question for ${entry.data.name}?`);
  
      jest.isolateModules(() => {
        require('./scripts/generate-questions');
        setImmediate(() => {
          expect(console.warn).toHaveBeenCalledWith('No se encontró entrada para categoría: paises');
          expect(generateQuestionForEntry).toHaveBeenCalledTimes(12);
          expect(generateQuestionForEntry).not.toHaveBeenCalledWith(
            expect.objectContaining({ data: null }),
            expect.any(String)
          );
          expect(console.log).toHaveBeenCalledWith('Ended generation of questions');
          done();
        });
      });
    });
  

  });