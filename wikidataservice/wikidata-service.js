import express from 'express';
import mongoose from 'mongoose';
import WikiQueries from './wikidataQueries.js';
import connectDatabase from '/usr/src/llmservice/config/database.js'; // Importamos la conexión centralizada

const app = express();
const port = 8020;

// Conectar a la base de datos usando la configuración centralizada
connectDatabase(mongoose);

// Definimos un esquema y modelo para almacenar las preguntas en MongoDB
const questionSchema = new mongoose.Schema({}, { strict: false }); // Permite cualquier estructura de datos
const QuestionModel = mongoose.model('Question', questionSchema);

async function obtenerYGuardarPreguntas(coleccion, obtenerDatos) {
    try {
        const data = await obtenerDatos();
        
        for (const item of data) {
            const existe = await QuestionModel.findOne(item);
            if (!existe) {
                await QuestionModel.create(item);
            }
        }
        return data;
    } catch (error) {
        console.error(`Error al obtener y guardar datos en ${coleccion}:`, error);
        return [];
    }
}

// Definición de rutas
app.get('/api/paises', async (req, res) => {
    const data = await obtenerYGuardarPreguntas('paises', WikiQueries.obtenerPaisYCapital);
    res.json(data);
});

app.get('/api/monumentos', async (req, res) => {
    const data = await obtenerYGuardarPreguntas('monumentos', WikiQueries.obtenerMonumentoYPais);
    res.json(data);
});

app.get('/api/elementos', async (req, res) => {
    const data = await obtenerYGuardarPreguntas('elementos', WikiQueries.obtenerSimboloQuimico);
    res.json(data);
});

app.get('/api/peliculas', async (req, res) => {
    const data = await obtenerYGuardarPreguntas('peliculas', WikiQueries.obtenerPeliculaYDirector);
    res.json(data);
});

app.get('/api/canciones', async (req, res) => {
    const data = await obtenerYGuardarPreguntas('canciones', WikiQueries.obtenerCancionYArtista);
    res.json(data);
});

app.get('/api/formula1', async (req, res) => {
    const data = await obtenerYGuardarPreguntas('formula1', WikiQueries.obtenerAñoYGanadorF1);
    res.json(data);
});

app.get('/api/pinturas', async (req, res) => {
    const data = await obtenerYGuardarPreguntas('pinturas', WikiQueries.obtenerPintorYObras);
    res.json(data);
});

const server = app.listen(port, () => {
    console.log(`API corriendo en http://localhost:${port}`);
});

export { server };
