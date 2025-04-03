const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

let connectDatabase, User;

try {
  connectDatabase = require('/usr/src/llmservice/config/database');
  User = require("/usr/src/llmservice/models/user-model")(mongoose);
} catch (error) {
  console.error("Error loading database configuration:", error);
  connectDatabase = require('../../llmservice/config/database');
  User = require("../../llmservice/models/user-model")(mongoose);
}

const app = express();
const port = 8002;

// Middleware para parsear JSON en el body
app.use(express.json());

// Conectar a la base de datos antes de iniciar el servidor
connectDatabase()
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Detener la app si la DB no se conecta
  });

// Validar campos en la petición
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
        if (!(field in req.body)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
}

// Ruta para login
app.post('/login', [
  check('username').isLength({ min: 3 }).trim().escape(),
  check('password').isLength({ min: 3 }).trim().escape()
], async (req, res) => {
  try {
    validateRequiredFields(req, ['username', 'password']);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    const { username, password } = req.body;

    // Buscar el usuario en la base de datos
    const user = await User.findOne({ username });

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });
      res.json({ token, username: user.username, createdAt: user.createdAt });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

  app.listen(port, () => {
    console.log(`Auth Service listening at http://localhost:${port}`);
  });

module.exports = { app, User, mongoose };
