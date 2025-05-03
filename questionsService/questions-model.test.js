const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let Question;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // IMPORTA el modelo pasando mongoose
  Question = require('./models/questions-model')(mongoose);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Question.deleteMany(); // Limpia entre pruebas
});

test('Guarda una pregunta válida', async () => {
  const questionData = {
    question: "¿Cuál es la capital de Francia?",
    correctAnswer: "París",
    incorrectAnswers: ["Madrid", "Roma", "Berlín"],
    category: "Geografía",
    imageUrl: "https://example.com/image.png"
  };

  const question = new Question(questionData);
  const saved = await question.save();

  expect(saved._id).toBeDefined();
  expect(saved.question).toBe(questionData.question);
  expect(saved.correctAnswer).toBe(questionData.correctAnswer);
  expect(saved.incorrectAnswers.length).toBe(3);
  expect(saved.imageUrl).toBe(questionData.imageUrl);
});

test('Falla si falta un campo requerido', async () => {
  const incompleteData = {
    correctAnswer: "París",
    incorrectAnswers: ["Madrid", "Roma", "Berlín"],
    category: "Geografía"
    // falta 'question'
  };

  const question = new Question(incompleteData);
  await expect(question.save()).rejects.toThrow(mongoose.Error.ValidationError);
});

test('Permite guardar sin imageUrl (campo opcional)', async () => {
  const questionData = {
    question: "¿Cuál es la capital de Italia?",
    correctAnswer: "Roma",
    incorrectAnswers: ["Milán", "Nápoles", "Florencia"],
    category: "Geografía"
    // no imageUrl
  };

  const question = new Question(questionData);
  const saved = await question.save();

  expect(saved.imageUrl).toBeUndefined();
});
