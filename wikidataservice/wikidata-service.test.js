const request = require('supertest');
const server = require('./wikidata-service'); 
const WikiQueries = require('./wikidataQueries');

// Mock de las funciones del servicio WikiQueries para simular las respuestas.
jest.mock('./wikidataQueries');

describe('API Routes', () => {

    // Test para la ruta /api/paises
    it('should return a list of countries and capitals', async () => {
        // Mock de la función obtenerPaisYCapital
        WikiQueries.obtenerPaisYCapital.mockResolvedValue([{ country: 'Spain', capital: 'Madrid' }]);

        const response = await request(server).get('/api/paises');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ country: 'Spain', capital: 'Madrid' }]);
    });

    // Test para la ruta /api/monumentos
    it('should return a list of monuments and countries', async () => {
        // Mock de la función obtenerMonumentoYPais
        WikiQueries.obtenerMonumentoYPais.mockResolvedValue([{ monument: 'Eiffel Tower', country: 'France' }]);

        const response = await request(server).get('/api/monumentos');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ monument: 'Eiffel Tower', country: 'France' }]);
    });

    // Test para la ruta /api/elementos
    it('should return a list of chemical elements', async () => {
        // Mock de la función obtenerSimboloQuimico
        WikiQueries.obtenerSimboloQuimico.mockResolvedValue([{ symbol: 'H', name: 'Hydrogen' }]);

        const response = await request(server).get('/api/elementos');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ symbol: 'H', name: 'Hydrogen' }]);
    });

    // Test para la ruta /api/peliculas
    it('should return a list of movies and directors', async () => {
        // Mock de la función obtenerPeliculaYDirector
        WikiQueries.obtenerPeliculaYDirector.mockResolvedValue([{ movie: 'Inception', director: 'Christopher Nolan' }]);

        const response = await request(server).get('/api/peliculas');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ movie: 'Inception', director: 'Christopher Nolan' }]);
    });

    // Test para la ruta /api/canciones
    it('should return a list of songs and artists', async () => {
        // Mock de la función obtenerCancionYArtista
        WikiQueries.obtenerCancionYArtista.mockResolvedValue([{ song: 'Imagine', artist: 'John Lennon' }]);

        const response = await request(server).get('/api/canciones');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ song: 'Imagine', artist: 'John Lennon' }]);
    });

    // Test para la ruta /api/formula1
    it('should return the F1 year and winner', async () => {
        // Mock de la función obtenerAñoYGanadorF1
        WikiQueries.obtenerAñoYGanadorF1.mockResolvedValue([{ year: 2021, winner: 'Lewis Hamilton' }]);

        const response = await request(server).get('/api/formula1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ year: 2021, winner: 'Lewis Hamilton' }]);
    });

    // Test para la ruta /api/pinturas
    it('should return a list of paintings and painters', async () => {
        // Mock de la función obtenerPintorYObras
        WikiQueries.obtenerPintorYObras.mockResolvedValue([{ painting: 'Mona Lisa', painter: 'Leonardo da Vinci' }]);

        const response = await request(server).get('/api/pinturas');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ painting: 'Mona Lisa', painter: 'Leonardo da Vinci' }]);
    });

    // Test para cuando ocurre un error
    it('should return an error message if there is an issue with the data', async () => {
        // Simular un error en una de las funciones de WikiQueries
        WikiQueries.obtenerPaisYCapital.mockRejectedValue(new Error('Error'));

        const response = await request(server).get('/api/paises');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Error al obtener los países" });
    });
});
