const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000', // Permite solicitudes solo desde este origen
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
}));

const connectDatabase = require('/usr/src/llmservice/config/database');
connectDatabase(mongoose); // Connect to MongoDB using the centralized configuration

const User = require("/usr/src/llmservice/models/user-model")(mongoose);

const app = express();
const port = 8001;

// Middleware to parse JSON in request body
app.use(express.json());

// Middleware to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
        if (!(field in req.body)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
}

// Endpoint to create a new user
app.post('/adduser', async (req, res) => {
    try {
        // Check if required fields are present in the request body
        validateRequiredFields(req, ['username', 'password']);

        // Check if the username already exists
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

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
    }
});

// Endpoint to get user details (username, profilePic, and password - hashed)
app.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            username: user.username,
            profilePic: user.profilePic ? user.profilePic.toString('base64') : null, // Convert binary data to base64
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to edit the profile picture
app.post('/user/:id/profile-pic', upload.single('profilePic'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Save the image buffer into the user's profilePic field
        user.profilePic = req.file.buffer;
        await user.save();

        res.status(200).json({ message: 'Profile picture updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to edit the username
app.put('/user/:id/username', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate that a new username is provided
        if (!req.body.username) {
            return res.status(400).json({ error: 'New username is required' });
        }

        // Check if the new username already exists
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Update the username
        user.username = req.body.username;
        await user.save();

        res.status(200).json({ message: 'Username updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to edit the password
app.put('/user/:id/password', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate that the current password and new password are provided
        if (!req.body.currentPassword || !req.body.newPassword || !req.body.confirmPassword) {
            return res.status(400).json({ error: 'All fields (currentPassword, newPassword, confirmPassword) are required' });
        }

        // Check if the current password is correct
        const isPasswordCorrect = await bcrypt.compare(req.body.currentPassword, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Check if the new password matches the confirmation password
        if (req.body.newPassword !== req.body.confirmPassword) {
            return res.status(400).json({ error: 'New password and confirmation do not match' });
        }

        // Hash the new password and update the user
        const hashedNewPassword = await bcrypt.hash(req.body.newPassword, 10);
        user.password = hashedNewPassword;

        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const server = app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`);
});

// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
});

module.exports = server;
