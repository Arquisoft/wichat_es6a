const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const YAML = require('yaml');

let User;
let History;

// Verificar si Mongoose ya está conectado antes de intentar conectar
if (mongoose.connection.readyState === 0) { // 0 = desconectado
  try {
    const connectDatabase = require('/usr/src/llmservice/config/database');
    connectDatabase(mongoose);
  } catch (error) {
    const connectDatabase = require('../../llmservice/config/database');
    connectDatabase(mongoose);
  }
}

// Cargar modelos
try {
  User = require('/usr/src/llmservice/models/user-model')(mongoose);
  History = require('/usr/src/llmservice/models/history-model')(mongoose);
} catch (error) {
  User = require('../../llmservice/models/user-model')(mongoose);
  History = require('../../llmservice/models/history-model')(mongoose);
}
const app = express();
const port = 8001;
// Crear un directorio para almacenar las imágenes de perfil
const uploadDir = './uploads/profile_pics';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Configuración de Multer para la carga de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Guardar imágenes en la carpeta 'uploads/profile_pics'
  },
  filename: function (req, file, cb) {
    const userId = req.params.id; // Usar el ID del usuario como nombre del archivo
    const fileExtension = path.extname(file.originalname); // Obtener la extensión del archivo (jpg, png, etc.)
    cb(null, `${userId}${fileExtension}`); // El nombre del archivo será el ID del usuario
  }
});

const upload = multer({ storage: storage });

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Validación de campos requeridos
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

// ✏️ Cambiar nombre de usuario
app.put('/user/:id/username', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const actualUserName = user.username;
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!req.body.username) {
      return res.status(400).json({ error: 'El nuevo nombre de usuario es obligatorio' });
    }

    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).json({ error: 'Este nombre de usuario ya está en uso' });
    }

    user.username = req.body.username;
    await user.save();

    await History.updateMany(
      { username: actualUserName },
      { $set: { username: req.body.username } }
    );

    res.status(200).json({ message: 'Username actualizado correctamente' });
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

// 📸 Subir imagen de perfil
app.post('/user/:id/profile-pic', upload.single('profilePic'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.profilePic = `/uploads/profile_pics/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📸 Obtener imagen de perfil
app.get('/user/:id/profile-pic', async (req, res) => {
  try {
    const userId = req.params.id;
    const imagePath = path.join(__dirname, 'uploads', 'profile_pics', `${userId}.png`);

    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ error: 'Profile picture not found' });
      }
      res.sendFile(imagePath);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🗑️ Eliminar imagen de perfil
app.delete('/user/:id/profile-pic', async (req, res) => {
  try {
    const userId = req.params.id;
    const imagePath = path.join(__dirname, 'Uploads', 'profile_pics', `${userId}.png`);

    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(400).json({ error: 'No profile picture to delete' });
      }

      fs.unlink(imagePath, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete the image' });
        }
        res.status(200).json({ message: 'Profile picture deleted successfully' });
      });
    });
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

// Configuración de Swagger
const openapiPath = './openapi.yaml';
if (fs.existsSync(openapiPath)) {
  const file = fs.readFileSync(openapiPath, 'utf8');
  const swaggerDocument = YAML.parse(file);
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.log('Not configuring OpenAPI. Configuration file not present.');
}

module.exports = server;