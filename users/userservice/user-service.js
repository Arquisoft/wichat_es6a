// user-service.js
const express = require('express');
const bcrypt = require('bcrypt'); 
const path = require('path');
const mongoose = require('mongoose');

const connectDatabase = require('/usr/src/llmservice/config/database');
connectDatabase(mongoose); // Connect to MongoDB using the centralized configuration

const User = require("/usr/src/llmservice/models/user-model")(mongoose);

const app = express();
const port = 8001;

// Middleware to parse JSON in request body
app.use(express.json());

// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
      if (!(field in req.body)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
}

app.post('/adduser', async (req, res) => {
    try {
        // Check if required fields are present in the request body
        validateRequiredFields(req, ['username', 'password']);

        // Encrypt the password before saving it
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            username: req.body.username,
            password: hashedPassword,
        });

        await newUser.save();
        res.json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message }); 
    }});

const server = app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});

// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server