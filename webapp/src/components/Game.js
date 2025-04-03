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

// Clase principal del juego
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

    this.usedFiftyFiftyOn = new Set();

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
      const response = await fetch("http://localhost:8003/generateQuestions", {
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

  // Termina el juego, calcula tiempo y guarda resultados
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

      const response = await fetch("http://localhost:8010/addGame", {
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

    // Navegar a la pantalla de fin de juego
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

  // Devuelve el texto de la pregunta actual
  getCurrentQuestionText() {
    if (this.questionIndex < this.questions.length) {
      return this.questions[this.questionIndex].questionText;
    }
    return "Fin del juego";
  }

  // Devuelve la racha actual
  getCurrentStreak() {
    return this.consecutiveCorrectAnswers;
  }

  // Devuelve el texto de una respuesta específica
  getCurrentQuestionAnswer(index) {
    if (this.questionIndex < this.questions.length) {
      return this.questions[this.questionIndex].answers[index]?.text;
    }
    return undefined;
  }

  // Devuelve la puntuación actual
  getCurrentPoints() {
    return this.score;
  }

  // Procesa la respuesta del jugador o el timeout
  answerQuestion(index, isTimeout = false) {
    // Verificar si el juego ya terminó o la pregunta no existe
    if (this.questionIndex >= this.questions.length) {
      console.warn("answerQuestion called after game should have ended.");
      return;
    }

    const currentQ = this.questions[this.questionIndex];

    // Si no es timeout, verificar la respuesta seleccionada
    if (!isTimeout) {
      if (index >= 0 && index < currentQ.answers.length) {
        if (currentQ.answers[index].isCorrect) {
          console.log("Respuesta Correcta!");
          this.correctAnswers++;
          this.consecutiveCorrectAnswers++;

          let basePoints = 100;
          if (this.usedFiftyFiftyOn.has(currentQ.questionText)) {
            basePoints = 50; // en caso de haberse usado 50/50
          }
          this.score += basePoints;
          this.score += this.consecutiveCorrectAnswers * 20;

          // Actualizar racha máxima
          if (
            this.consecutiveCorrectAnswers > this.maxConsecutiveCorrectAnswers
          ) {
            this.maxConsecutiveCorrectAnswers = this.consecutiveCorrectAnswers;
          }
        } else {
          console.log("Respuesta Incorrecta.");
          this.consecutiveCorrectAnswers = 0; // Romper racha
        }
      } else {
        console.error(
          `Índice de respuesta inválido (${index}) para la pregunta actual.`
        );
        this.consecutiveCorrectAnswers = 0; // Considerar incorrecta si el índice es inválido
      }
    } else {
      // Si es timeout, simplemente romper la racha
      console.log("Timeout!");
      this.consecutiveCorrectAnswers = 0;
    }

    // Avanzar a la siguiente pregunta
    this.questionIndex++;

    // Comprobar si el juego ha terminado después de avanzar
    if (this.questionIndex >= this.questions.length) {
      console.log("Última pregunta respondida. Finalizando juego...");
      this.endGame(); // Llamar a endGame si ya no hay más preguntas
    }
  }

  // Devuelve el objeto de la pregunta actual
  getCurrentQuestion() {
    // Devuelve la pregunta actual o undefined si el índice está fuera de rango
    return this.questions[this.questionIndex];
  }

  // Parsea las preguntas desde el string JSON
  parseQuestions(inputString) {
    try {
      // Limpieza básica inicial (puede no ser necesaria si el backend devuelve JSON válido)
      const cleanedString = inputString
        .replace(/^`+json/, "") // Quita ```json al inicio
        .replace(/`+$/, "") // Quita ``` al final
        .trim();

      // Intentar parsear directamente como JSON
      const data = JSON.parse(cleanedString);

      // Validar la estructura esperada { questions: [...] }
      if (!data || !Array.isArray(data.questions)) {
        console.error(
          "Parsed data does not contain a 'questions' array:",
          data
        );
        throw new Error(
          "Formato de datos inválido: falta el array 'questions'."
        );
      }

      // Mapear a las clases Question y Answer
      return data.questions
        .map((qData) => {
          if (!qData.question || !Array.isArray(qData.answers)) {
            console.warn("Skipping invalid question structure:", qData);
            return null; // O manejar el error de otra forma
          }
          const answers = qData.answers.map((aData) => {
            // Asegurarse que 'isCorrect' sea booleano
            const isCorrect =
              typeof aData.isCorrect === "boolean"
                ? aData.isCorrect
                : String(aData.isCorrect).toLowerCase() === "true";
            return new Answer(aData.text || "", isCorrect); // Usar "" si text falta
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

  useFiftyFifty() {
    const current = this.getCurrentQuestion();
    if (current) {
      this.usedFiftyFiftyOn.add(current.questionText);
    }
  }
  
}

export default Game;
