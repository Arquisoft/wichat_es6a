const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    correctAnswer: {
        type: String,
        required: true,
    },
    incorrectAnswers: {
        type: [String], // Array de 3 respuestas incorrectas
        required: true,
    }
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
