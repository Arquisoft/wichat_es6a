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
    this.timeRemaining = 30; // 30 segundos por pregunta
  }

  async init() {
    console.log("Cambio realizado");
    try {
      const response = await fetch("http://localhost:8003/generateQuestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ context: "Historia universal" }),
      });

      console.log("Response:", response);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch questions: ${response.status} ${response.statusText}`
        );
      }

      const textData = await response.text();
      const data = JSON.parse(textData);
      var stringData = JSON.stringify(data);
      stringData = stringData
        .replace(/^`jso/, "") // Elimina "`jso" del inicio
        .replace(/`$/, "") // Elimina "`" del final
        .replace(/\\n|\\/g, "") // Elimina todos los \n, \ y letras n innecesarias
        .replace(/\\"/g, '"'); // Convierte las comillas escapadas `\"` en comillas normales `"`.

      console.log(stringData);

      this.questions = this.parseQuestions(stringData);

      console.log("Preguntas guardadas en el objeto Game:", this.questions);
    } catch (error) {
      console.error("Error fetching questions:", error.message);
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

  /**
   * @param {number} index - El índice de la respuesta seleccionada.
   * @param {boolean} [isTimeout=false] - Si es true, indica que se respondió por timeout.
   */
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
        // Timeout: No se suman puntos y se reinicia la racha.
        this.consecutiveCorrectAnswers = 0;
      }
      this.questionIndex++;
    }

    if (this.questionIndex >= this.questions.length) {
      this.endGame();
    } else {
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
