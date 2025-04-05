module.exports = (mongoose) => {
  // Esquema de una partida
  const gameSchema = new mongoose.Schema({
    score: { type: Number, required: true },
    correctQuestions: { type: Number, required: true },
    recordedAt: { type: Date, default: Date.now },
    gameId: { type: Number, required: true }
  });

  // Esquema del usuario con las partidas embebidas en el campo 'games'
  const userGamesSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    games: [gameSchema] // Lista de partidas embebidas dentro del usuario
  });

  return mongoose.model("UserGames", userGamesSchema);
};