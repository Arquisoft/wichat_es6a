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
    this.category = "";
    this.startTime = null;
    this.endTime = null;
    this.totalTimeTaken = 0;

    // ✅ Variables de entorno
    this.llmServiceUrl = process.env.REACT_APP_LLM;
    this.historyServiceUrl = process.env.REACT_APP_HISTORY;
  }

  async init(category) {
    console.log("Inicializando juego con categoría:", category);
    this.category = category;
    this.startTime = Date.now();
    this.questionIndex = 0;
    this.score = 0;
    this.correctAnswers = 0;
    this.consecutiveCorrectAnswers = 0;
    this.maxConsecutiveCorrectAnswers = 0;

    try {
      const categoryName = category ? category.name.toLowerCase() : "variado";
      const response = await fetch(`${this.llmServiceUrl}/generateQuestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryName,
          questionCount: 4,
        }),
      });

      console.log("Response status from /generateQuestions:", response.status);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch questions: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Parsed questions data:", data);

      if (data && Array.isArray(data.questions)) {
        this.questions = data.questions.map((qData) => {
          const answers = qData.answers.map(
            (aData) => new Answer(aData.text, aData.isCorrect)
          );
          return new Question(qData.question, answers);
        });
      } else {
        console.error(
          "Formato inesperado recibido de /generateQuestions:",
          data
        );
        throw new Error("Formato de preguntas inesperado.");
      }

      if (!this.questions || this.questions.length === 0) {
        console.warn(
          "No se obtuvieron/parsearon preguntas del servidor, cargando preguntas de prueba"
        );
        await this.TestingInit();
      }

      console.log("Preguntas guardadas en el objeto Game:", this.questions);
    } catch (error) {
      console.error("Error fetching or parsing questions:", error.message);
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
    if (!this.startTime) {
      this.startTime = Date.now();
    }
  }

  async endGame() {
    this.endTime = Date.now();
    if (!this.startTime) {
      console.error(
        "Error: El tiempo de inicio no está registrado para calcular el total."
      );
      this.totalTimeTaken = 0;
    } else {
      this.totalTimeTaken = Math.floor((this.endTime - this.startTime) / 1000);
    }
    console.log(
      "Tiempo total de la partida (en segundos):",
      this.totalTimeTaken
    );

    try {
      const username = localStorage.getItem("username");
      if (!username) throw new Error("No username found in localStorage");

      const response = await fetch(`${this.historyServiceUrl}/addGame`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          score: this.score,
          correctQuestions: this.correctAnswers,
          category: this.category?.name || "General",
          timeTaken: this.totalTimeTaken,
          totalQuestions: this.questions.length,
          maxStreak: this.maxConsecutiveCorrectAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error saving game: ${response.status}. ${errorData}`);
      }
      console.log("Game saved successfully");
    } catch (error) {
      console.error("Error saving game:", error);
    }

    if (this.navigate) {
      this.navigate("/endGame", {
        state: {
          score: this.score || 0,
          correctAnswers: this.correctAnswers || 0,
          totalQuestions: this.questions.length || 0,
          streak: this.maxConsecutiveCorrectAnswers || 0,
          timeTaken: this.totalTimeTaken,
          category: this.category?.name || "General",
        },
      });
    } else {
      console.warn("Navigate function not available in Game instance.");
    }
  }

  getCurrentQuestionText() {
    if (this.questionIndex < this.questions.length) {
      return this.questions[this.questionIndex].questionText;
    }
    return "Fin del juego";
  }

  getCurrentStreak() {
    return this.consecutiveCorrectAnswers;
  }

  getCurrentQuestionAnswer(index) {
    if (this.questionIndex < this.questions.length) {
      return this.questions[this.questionIndex].answers[index]?.text;
    }
    return undefined;
  }

  getCurrentPoints() {
    return this.score;
  }

  answerQuestion(index, isTimeout = false) {
    if (this.questionIndex >= this.questions.length) {
      console.warn("answerQuestion called after game should have ended.");
      return;
    }

    const currentQ = this.questions[this.questionIndex];

    if (!isTimeout) {
      if (index >= 0 && index < currentQ.answers.length) {
        if (currentQ.answers[index].isCorrect) {
          console.log("Respuesta Correcta!");
          this.correctAnswers++;
          this.consecutiveCorrectAnswers++;
          this.score += 100;
          this.score += this.consecutiveCorrectAnswers * 20;
          if (
            this.consecutiveCorrectAnswers > this.maxConsecutiveCorrectAnswers
          ) {
            this.maxConsecutiveCorrectAnswers = this.consecutiveCorrectAnswers;
          }
        } else {
          console.log("Respuesta Incorrecta.");
          this.consecutiveCorrectAnswers = 0;
        }
      } else {
        console.error(
          `Índice de respuesta inválido (${index}) para la pregunta actual.`
        );
        this.consecutiveCorrectAnswers = 0;
      }
    } else {
      console.log("Timeout!");
      this.consecutiveCorrectAnswers = 0;
    }

    this.questionIndex++;

    if (this.questionIndex >= this.questions.length) {
      console.log("Última pregunta respondida. Finalizando juego...");
      this.endGame();
    }
  }

  getCurrentQuestion() {
    return this.questions[this.questionIndex];
  }

  parseQuestions(inputString) {
    try {
      const cleanedString = inputString
        .replace(/^`+json/, "")
        .replace(/`+$/, "")
        .trim();

      const data = JSON.parse(cleanedString);

      if (!data || !Array.isArray(data.questions)) {
        console.error(
          "Parsed data does not contain a 'questions' array:",
          data
        );
        throw new Error(
          "Formato de datos inválido: falta el array 'questions'."
        );
      }

      return data.questions
        .map((qData) => {
          if (!qData.question || !Array.isArray(qData.answers)) {
            console.warn("Skipping invalid question structure:", qData);
            return null;
          }
          const answers = qData.answers.map((aData) => {
            const isCorrect =
              typeof aData.isCorrect === "boolean"
                ? aData.isCorrect
                : String(aData.isCorrect).toLowerCase() === "true";
            return new Answer(aData.text || "", isCorrect);
          });
          return new Question(qData.question, answers);
        })
        .filter((q) => q !== null);
    } catch (error) {
      console.error(
        "Error parsing questions JSON:",
        error,
        "Input string:",
        inputString
      );
      return [];
    }
  }
}

export default Game;
