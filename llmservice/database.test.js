const mongoose = require('mongoose');
jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

describe('MongoDB Configuration', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should connect to test database when NODE_ENV is test', async () => {
    process.env.NODE_ENV = 'test';
    const mockConnect = mongoose.connect.mockResolvedValueOnce({});

    const result = require('./config/database')(mongoose);

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/testdb');
    expect(result).toBe(mongoose);
  });

  it('should connect to provided MONGO_URI in non-test environment', async () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGO_URI = 'mongodb://custom:27017/customdb';
    const mockConnect = mongoose.connect.mockResolvedValueOnce({});

    const result = require('./config/database')(mongoose);

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://custom:27017/customdb');
    expect(result).toBe(mongoose);
  });

  it('should use default MONGO_URI when not provided in non-test environment', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.MONGO_URI;
    const mockConnect = mongoose.connect.mockResolvedValueOnce({});

    const result = require('./config/database')(mongoose);

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://mongodb-wichat_es6a:27017/wichatdb');
    expect(result).toBe(mongoose);
  });

  it('should handle connection errors', async () => {
    process.env.NODE_ENV = 'test';
    const error = new Error('Connection failed');
    const mockConnect = mongoose.connect.mockRejectedValueOnce(error);

    const result = require('./config/database')(mongoose);

    await new Promise(resolve => setImmediate(resolve)); // Wait for promise rejection
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/testdb');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error en la conexión a MongoDB:', 'Connection failed');
    expect(result).toBe(mongoose);
  });
});