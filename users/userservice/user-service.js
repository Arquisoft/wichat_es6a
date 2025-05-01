const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const swaggerUi = require('swagger-ui-express'); 
const fs = require("fs")
const YAML = require('yaml');


let User; 
let History; 

try {
  const connectDatabase = require("/usr/src/llmservice/config/database.js");
  connectDatabase(mongoose);
  User = require("/usr/src/llmservice/models/user-model")(mongoose);
  History = require("/usr/src/llmservice/models/history-model")(mongoose);
} catch (error) {
  const connectDatabase = require("../../llmservice/config/database.js");
  connectDatabase(mongoose);
  User = require("../../llmservice/models/user-model")(mongoose);
  History = require("../../llmservice/models/history-model")(mongoose);
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
    cb(null, uploadDir);  // Guardar imágenes en la carpeta 'uploads/profile_pics'
  },
  filename: function (req, file, cb) {
    const userId = req.params.id;  // Usar el ID del usuario como nombre del archivo
    const fileExtension = path.extname(file.originalname);  // Obtener la extensión del archivo (jpg, png, etc.)
    cb(null, `${userId}${fileExtension}`);  // El nombre del archivo será el ID del usuario
  }
});

const upload = multer({ storage: storage });

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ✅ Validación de campos requeridos
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
    // Buscar al usuario
    const user = await User.findById(req.params.id);
    const actualUserName = user.username;
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Validar el nuevo nombre de usuario
    if (!req.body.username) {
      return res.status(400).json({ error: 'El nuevo nombre de usuario es obligatorio' });
    }

    // Verificar si el nombre de usuario ya existe
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).json({ error: 'Este nombre de usuario ya está en uso' });
    }

    // Actualizar el nombre de usuario en el perfil del usuario
    user.username = req.body.username;
    await user.save();

    // Actualizar el nombre de usuario en todas las partidas del usuario
    // Actualizar todos los registros de "History" (partidas) donde el campo "username" sea igual al antiguo nombre de usuario
    await History.updateMany(
      { username: actualUserName },  // Filtrar las partidas donde el nombre de usuario coincida
      { $set: { username: req.body.username } }  // Actualizar el campo "username" a su nuevo valor
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
    console.log('Received request to upload profile picture for user:', req.params.id);

    // Verificar si se subió un archivo
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file.filename);

    // Buscar el usuario
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Guardar la URL de la imagen en el perfil del usuario
    user.profilePic = `/uploads/profile_pics/${req.file.filename}`;
    await user.save();

    console.log('Profile picture saved successfully for user:', req.params.id);

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicUrl: `http://localhost:8001${user.profilePic}`,
    });
  } catch (error) {
    console.log('Error occurred while uploading profile picture:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// 📸 Obtener imagen de perfil
app.get('/user/:id/profile-pic', async (req, res) => {
  try {
    const userId = req.params.id;
    const imagePath = path.join(__dirname, 'uploads', 'profile_pics', `${userId}.png`);  // Ruta completa a la imagen

    // Verificar si el archivo existe
    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ error: 'Profile picture not found' });
      }

      // Si el archivo existe, devolverlo como un archivo binario
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
    
    // Construir la ruta de la imagen de perfil de acuerdo al ID
    const imagePath = path.join(__dirname, 'uploads', 'profile_pics', `${userId}.png`);

    // Verificar si el archivo existe
    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(400).json({ error: 'No profile picture to delete' });
      }

      // Eliminar el archivo de la imagen de perfil en el sistema de archivos
      fs.unlink(imagePath, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete the image' });
        }

        // En este caso, como no estamos guardando la URL en la base de datos, no es necesario actualizar nada en la base de datos
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

// **Configuración de Swagger**
openapiPath = './openapi.yaml'
if (fs.existsSync(openapiPath)) {
  const file = fs.readFileSync(openapiPath, 'utf8');
  const swaggerDocument = YAML.parse(file);
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.log("Not configuring OpenAPI. Configuration file not present.")
}

module.exports = server;
