module.exports = (mongoose) => {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://mongodb-wichat_es6a:27017/wichatdb";
  
    mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Conectado a MongoDB"))
    .catch(err => console.error("Error en la conexión a MongoDB:", err));
  
    return mongoose;
  };