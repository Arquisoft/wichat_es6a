module.exports = (mongoose) => {
  const isTest = process.env.NODE_ENV === "test";

  const MONGO_URI = isTest
    ? "mongodb://localhost:27017/testdb"
    : process.env.MONGO_URI || "mongodb://mongodb-wichat_es6a:27017/wichatdb";

  mongoose.connect(MONGO_URI)
    .then(() => console.log(`Conectado a MongoDB en ${MONGO_URI}`))
    .catch(err => console.error("Error en la conexión a MongoDB:", err.message));

  return mongoose;
};