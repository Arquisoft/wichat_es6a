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
    },
    totalQuestions: {
        type: Number,
        required: false, 
    },
});

module.exports = (mongoose) => {
  return mongoose.model('History', historySchema, 'usergames');
};