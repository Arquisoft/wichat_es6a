class Answer {
  constructor(text, isCorrect) {
    this.text = text;
    this.isCorrect = isCorrect;
  }
}

class Question {
  constructor(questionText, answers) {
    this.questionText = questionText;
    this.answers = answers;
  }
}

class Game {
  constructor(navigate) {
    this.questions = [];
    this.questionIndex = 0;
    this.score = 0;
    this.navigate = navigate;
    this.consecutiveCorrectAnswers = 0;
    this.correctAnswers = 0;
    this.maxConsecutiveCorrectAnswers = 0;
    this.timer = null;
    this.timeRemaining = 30;
  }

  async init(category) {
    console.log("Inicializando juego con categoría:", category);
    try {
      // Preparar el endpoint y el nombre de la categoría
      const categoryName = category ? category.name.toLowerCase() : "variado";
      
      const response = await fetch("http://localhost:8003/generateQuestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: categoryName,
          questionCount: 4
        }),
      });
  
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch questions: ${response.status} ${response.statusText}`
        );
      }
  
      const textData = await response.text();
      console.log("Response text:", textData);
      
      const data = JSON.parse(textData);
      var stringData = JSON.stringify(data);
      stringData = stringData
        .replace(/^`jso/, "")
        .replace(/`$/, "")
        .replace(/\\n|\\/g, "")
        .replace(/\\"/g, '"');
  
      console.log("Processed data:", stringData);
  
      this.questions = this.parseQuestions(stringData);
  
      // Si no hay preguntas, cargar las de prueba
      if (!this.questions || this.questions.length === 0) {
        console.warn("No se obtuvieron preguntas del servidor, cargando preguntas de prueba");
        await this.TestingInit();
      }
  
      console.log("Preguntas guardadas en el objeto Game:", this.questions);
    } catch (error) {
      console.error("Error fetching questions:", error.message);
      // En caso de error, cargar preguntas de prueba
      await this.TestingInit();
    }
  }

  async TestingInit() {
    console.log("Modo de prueba activado: Cargando preguntas predefinidas");

    this.questions = [
      new Question("¿Cuál es la capital de Francia?", [
        new Answer("Madrid", false),
        new Answer("París", true),
        new Answer("Berlín", false),
        new Answer("Lisboa", false),
      ]),
      new Question("¿Quién escribió 'Don Quijote de la Mancha'?", [
        new Answer("Miguel de Cervantes", true),
        new Answer("Gabriel García Márquez", false),
        new Answer("William Shakespeare", false),
        new Answer("Federico García Lorca", false),
      ]),
      new Question("¿En qué año llegó el ser humano a la Luna?", [
        new Answer("1969", true),
        new Answer("1975", false),
        new Answer("1965", false),
        new Answer("1980", false),
      ]),
      new Question("¿Cuál es el océano más grande del mundo?", [
        new Answer("Atlántico", false),
        new Answer("Índico", false),
        new Answer("Pacífico", true),
        new Answer("Ártico", false),
      ]),
    ];

    console.log("Preguntas de prueba cargadas:", this.questions);
  }

  endGame() {
    if (this.consecutiveCorrectAnswers > this.maxConsecutiveCorrectAnswers) {
      this.maxConsecutiveCorrectAnswers = this.consecutiveCorrectAnswers;
    }
    if (this.navigate) {
      this.navigate("/endGame", {
        state: {
          score: this.score || 0,
          correctAnswers: this.correctAnswers || 0,
          totalQuestions: this.questions.length || 0,
          streak: this.maxConsecutiveCorrectAnswers || 0,
        },
      });
    }
  }

  getCurrentQuestionText() {
    return this.questions[this.questionIndex].questionText;
  }

  getCurrentStreak() {
    return this.consecutiveCorrectAnswers;
  }

  getCurrentQuestionAnswer(index) {
    return this.questions[this.questionIndex].answers[index]?.text;
  }

  getCurrentPoints() {
    return this.score;
  }

  answerQuestion(index, isTimeout = false) {
    if (
      this.questionIndex < this.questions.length &&
      this.questions[this.questionIndex].answers[index]
    ) {
      if (!isTimeout) {
        if (this.questions[this.questionIndex].answers[index].isCorrect) {
          this.correctAnswers++;
          this.consecutiveCorrectAnswers++;
          this.score += 100;
          this.score += this.consecutiveCorrectAnswers * 20;
        } else {
          if (
            this.consecutiveCorrectAnswers > this.maxConsecutiveCorrectAnswers
          ) {
            this.maxConsecutiveCorrectAnswers = this.consecutiveCorrectAnswers;
          }
          this.consecutiveCorrectAnswers = 0;
        }
      } else {
        this.consecutiveCorrectAnswers = 0;
      }
      this.questionIndex++;
    }

    if (this.questionIndex >= this.questions.length) {
      this.endGame();
    }
  }

  getCurrentQuestion() {
    return this.questions[this.questionIndex];
  }

  parseQuestions(inputString) {
    const cleanedString = inputString
      .replace(/^`json/, "")
      .replace(/`$/, "")
      .trim();

    const questionBlocks = cleanedString.match(
      /"question":\s*"([^"]+)",\s*"answers":\s*\[(.*?)\]/gs
    );

    if (!questionBlocks) {
      throw new Error("No se encontraron preguntas en el texto.");
    }

    const questions = questionBlocks.map((block) => {
      const questionMatch = block.match(/"question":\s*"([^"]+)"/);
      const questionText = questionMatch ? questionMatch[1] : "";

      const answersMatch = block.match(/"answers":\s*\[(.*?)\]/);
      const answersText = answersMatch ? answersMatch[1] : "";

      const answerObjects = [
        ...answersText.matchAll(
          /\{[^}]*"text":\s*"([^"]+)",\s*"correct":\s*(true|false)[^}]*\}/g
        ),
      ].map((match) => new Answer(match[1], match[2] === "true"));

      return new Question(questionText, answerObjects);
    });

    return questions;
  }

  startTimer() {
    this.timeRemaining = 30;
    this.timer = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  resetTimer() {
    clearInterval(this.timer);
    this.startTimer();
  }
}

export default Game;
