const {server, parseJsonResponse} = require  ('./llm-service');

// Función auxiliar para simular console.error en los tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Limpiar los mocks después de cada test
afterEach(() => {
  mockConsoleError.mockClear();
});

// Restaurar console.error después de todos los tests
afterAll(() => {
  mockConsoleError.mockRestore();
  server.close();
});

describe('parseJsonResponse', () => {
  // Test 1: Debería parsear un JSON válido directamente
  test('parsea un JSON válido correctamente', () => {
    const validJson = '{"name": "Test", "value": 123}';
    const result = parseJsonResponse(validJson);
    expect(result).toEqual({ name: 'Test', value: 123 });
  });

  // Test 2: Debería manejar objetos ya parseados
  test('devuelve el objeto si ya está parseado', () => {
    const parsedObject = { name: 'Test', value: 123 };
    const result = parseJsonResponse(parsedObject);
    expect(result).toBe(parsedObject);
  });

  // Test 3: Debería limpiar formato markdown code block
  test('parsea JSON contenido en bloque de código markdown', () => {
    const markdownJson = '```json\n{"name": "Test", "value": 123}\n```';
    const result = parseJsonResponse(markdownJson);
    expect(result).toEqual({ name: 'Test', value: 123 });
  });

  // Test 4: Debería extraer JSON si hay texto alrededor
  test('extrae y parsea JSON cuando hay texto antes y después', () => {
    const messyJson = 'Aquí está tu resultado: {"name": "Test", "value": 123} Espero que te sirva.';
    const result = parseJsonResponse(messyJson);
    expect(result).toEqual({ name: 'Test', value: 123 });
  });

  // Test 6: Debería manejar arrays JSON
  test('parsea arrays JSON correctamente', () => {
    const jsonArray = '[1, 2, 3, {"test": true}]';
    const result = parseJsonResponse(jsonArray);
    expect(result).toEqual([1, 2, 3, { test: true }]);
  });

  // Test 7: Debería fallar con entradas que no son strings ni objetos
  test('lanza error con entrada que no es string ni objeto', () => {
    expect(() => parseJsonResponse(123)).toThrow('Invalid input: Expected a JSON string.');
    expect(() => parseJsonResponse(null)).toThrow('Invalid input: Expected a JSON string.');
    expect(() => parseJsonResponse(undefined)).toThrow('Invalid input: Expected a JSON string.');
  });

  // Test 8: Debería fallar cuando no se puede parsear ninguna parte como JSON
  test('lanza error cuando no puede parsear ninguna parte como JSON', () => {
    const invalidJson = 'Esto no es JSON en absoluto';
    expect(() => parseJsonResponse(invalidJson)).toThrow('Could not parse LLM response as JSON after multiple attempts.');
    expect(mockConsoleError).toHaveBeenCalled();
  });

  // Test 9: Debería manejar JSON con formato incorrecto pero recuperable
  test('maneja JSON con formato incorrecto pero recuperable', () => {
    const malformattedJson = '```\n{"name": "Test",\n"value": 123\n}\n```';
    const result = parseJsonResponse(malformattedJson);
    expect(result).toEqual({ name: 'Test', value: 123 });
  });

  // Test 10: Debería manejar JSON con espacios en blanco adicionales
  test('maneja JSON con espacios en blanco adicionales', () => {
    const spacedJson = `
      
      {
        "name": "Test", 
        "value": 123
      }
      
    `;
    const result = parseJsonResponse(spacedJson);
    expect(result).toEqual({ name: 'Test', value: 123 });
  });

  // Test 11: Debería registrar el mensaje de error y el string problemático
  test('registra el mensaje de error y el string problemático cuando falla', () => {
    const invalidJson = 'No soy JSON válido { "name": malformado }';
    
    expect(() => parseJsonResponse(invalidJson)).toThrow();
    
    // Verificar que se llamó a console.error con los mensajes esperados
    expect(mockConsoleError).toHaveBeenCalledTimes(2);
    expect(mockConsoleError.mock.calls[0][0]).toBe('[parseJsonResponse] All JSON parsing attempts failed.');
    expect(mockConsoleError.mock.calls[1][0]).toBe('[parseJsonResponse] Original string causing error:');
  });

  // Test 12: Caso extremo - JSON muy grande
  test('maneja JSON muy grande', () => {
    // Crear un JSON grande con muchos elementos
    const largeArray = Array(1000).fill().map((_, i) => ({ id: i, value: `item-${i}` }));
    const largeJson = JSON.stringify({ results: largeArray });
    
    const result = parseJsonResponse(largeJson);
    expect(result.results.length).toBe(1000);
    expect(result.results[0].id).toBe(0);
    expect(result.results[999].id).toBe(999);
  });
});