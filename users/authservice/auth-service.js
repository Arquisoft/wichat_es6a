const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express'); 
const fs = require("fs")
const YAML = require('yaml');

const app = express();
const port = 8002;

const User = require("./auth-model");

app.use(express.json());

function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
        if (!(field in req.body)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
}

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.post('/login', [
    check('username').isLength({ min: 3 }).trim().escape(),
    check('password').isLength({ min: 3 }).trim().escape()
], async (req, res) => {
    try {
        validateRequiredFields(req, ['username', 'password']);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array().toString() });
        }

        const username = req.body.username.toString();
        const password = req.body.password.toString();

        const user = await User.findOne({ username });

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });
            res.json({ token: token, userId: user._id, username: user.username });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// **Configuración de Swagger**
let openapiPath = './openapi.yaml'
if (fs.existsSync(openapiPath)) {
  const file = fs.readFileSync(openapiPath, 'utf8');
  const swaggerDocument = YAML.parse(file);
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.log("Not configuring OpenAPI. Configuration file not present.")
}

// Only connect and start server if the file is run directly
if (require.main === module) {
    // Only connect to database if running the server normally
    const connectDatabase = require('/usr/src/llmservice/config/database');
    connectDatabase(mongoose);

    app.listen(port, () => {
        console.log(`Auth Service listening at http://localhost:${port}`);
    });
}


module.exports = app;
