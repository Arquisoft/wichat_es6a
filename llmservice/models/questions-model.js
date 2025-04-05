module.exports = (mongoose) => {
    // Esquema de una pregunta
    const questionSchema = new mongoose.Schema({
        question: { type: String, required: true},
        correctAnswer: { type: String, required: true},
        incorrectAnswers: { type: [String], required: true },
        category: {type: String, required: true }
    });

    return mongoose.model("Question", questionSchema);
}