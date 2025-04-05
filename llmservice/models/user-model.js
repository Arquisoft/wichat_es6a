module.exports = (mongoose) => {
  const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: Buffer,  // Almacenamos la imagen en formato binario
      default: null, // Si no se proporciona una imagen, sera nula
    },
    createdAt: {
      type: Date,
      default: Date.now, 
    }
  });

  return mongoose.model('User', userSchema);
};
