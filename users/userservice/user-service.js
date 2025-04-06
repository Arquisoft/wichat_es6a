const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Conectar a la base de datos MongoDB
const connectDatabase = require('/usr/src/llmservice/config/database');
connectDatabase(mongoose);

const User = require("/usr/src/llmservice/models/user-model")(mongoose);

const app = express();
const port = 8001;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// 📁 Carpeta para imágenes de perfil
const imageFolder = path.join(__dirname, 'profileImg');
if (!fs.existsSync(imageFolder)) {
  fs.mkdirSync(imageFolder);
}

// ⚙️ Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageFolder),
  filename: (req, file, cb) => {
    const userId = req.params.id;
    const filePath = path.join(imageFolder, `${userId}.png`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    cb(null, `${userId}.png`);
  }
});
const upload = multer({ storage });

// ✅ Validación de campos requeridos
function validateRequiredFields(req, requiredFields) {
  for (const field of requiredFields) {
    if (!(field in req.body)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

// 🔐 Crear usuario
app.post('/adduser', async (req, res) => {
  try {
    validateRequiredFields(req, ['username', 'password']);
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

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

// 🧾 Obtener detalles de usuario
app.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      username: user.username,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📤 Subir imagen de perfil
app.post('/user/:id/profile-pic', upload.single('profilePic'), (req, res) => {
  res.status(200).json({ message: 'Imagen de perfil actualizada' });
});

// 🖼 Obtener imagen de perfil
app.get('/user/:id/profile-pic', (req, res) => {
  const filePath = path.join(imageFolder, `${req.params.id}.png`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Imagen no encontrada' });
  }
});

// 🗑 Eliminar imagen de perfil
app.delete('/user/:id/profile-pic', (req, res) => {
  const filePath = path.join(imageFolder, `${req.params.id}.png`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.status(200).json({ message: 'Imagen eliminada correctamente' });
  } else {
    res.status(404).json({ error: 'Imagen no existe' });
  }
});

// ✏️ Cambiar nombre de usuario
app.put('/user/:id/username', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!req.body.username) {
      return res.status(400).json({ error: 'New username is required' });
    }

    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    user.username = req.body.username;
    await user.save();
    res.status(200).json({ message: 'Username updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔒 Cambiar contraseña
app.put('/user/:id/password', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation do not match' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
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

server.on('close', () => {
  mongoose.connection.close();
});

module.exports = server;
