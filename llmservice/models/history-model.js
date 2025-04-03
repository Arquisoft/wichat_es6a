module.exports = (mongoose) => {
  const historySchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    correctQuestions: {
        type: Number,
        required: true,
      },
    recordedAt: {
      type: Date,
      default: Date.now, 
    },
    gameId: {
        type: Number,
        required: true,
    }
  });

  return mongoose.model('History', historySchema);
}