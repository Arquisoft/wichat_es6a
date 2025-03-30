const express = require('express');
const WikiQueries = require('./wikidataQueries');

const app = express();
const port = 8020;

app.get('/api/paises', async (req, res) => {
    try {
        const data = await WikiQueries.obtenerPaisYCapital();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los países" });
        console.log(error);
    }
});

app.get('/api/monumentos', async (req, res) => {
    try {
        const data = await WikiQueries.obtenerMonumentoYPais();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los monumentos" });
    }
});

app.get('/api/elementos', async (req, res) => {
    try {
        const data = await WikiQueries.obtenerSimboloQuimico();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los elementos químicos" });
    }
});

app.get('/api/peliculas', async (req, res) => {
    try {
        const data = await WikiQueries.obtenerPeliculaYDirector();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las películas" });
    }
});

app.get('/api/canciones', async (req, res) => {
    try {
        const data = await WikiQueries.obtenerCancionYArtista();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las canciones" });
    }
});

app.get('/api/formula1', async (req, res) => {
    try {
        const data = await WikiQueries.obtenerAñoYGanadorF1();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los datos de Fórmula 1" });
    }
});

app.get('/api/pinturas', async (req, res) => {
    try {
        const data = await WikiQueries.obtenerPintorYObras();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las pinturas" });
    }
});

const server = app.listen(port, () => {
    console.log(` API corriendo en http://localhost:${port}`);
});

module.exports = server;

