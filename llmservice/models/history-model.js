const mongoose = require('mongoose');

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
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: false, 
    },
    timeTaken: {
        type: Number,
        required: false, 
    }
});

module.exports = (mongoose) => {
  if (mongoose.models.History) {
    return mongoose.models.History; // Si ya existe el modelo, lo usamos
  }
  
  return mongoose.model('History', historySchema, 'usergames');
};
