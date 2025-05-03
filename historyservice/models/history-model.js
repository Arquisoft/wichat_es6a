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
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
});

module.exports = (mongoose) => {
  const modelName = 'History';
  // Return existing model if already compiled
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  return mongoose.model(modelName, historySchema, 'usergames');
};