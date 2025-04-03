// Definición de clases auxiliares (sin cambios)
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
    this.questions = []; // Array para almacenar las preguntas
    this.questionIndex = 0; // Índice de la pregunta actual
    this.score = 0; // Puntuación del jugador
    this.navigate = navigate; // Función de navegación (de react-router-dom)
    this.consecutiveCorrectAnswers = 0; // Contador de racha actual
    this.correctAnswers = 0; // Contador total de respuestas correctas
    this.maxConsecutiveCorrectAnswers = 0; // Máxima racha alcanzada
    // this.timer = null; // ELIMINADO - Ya no se necesita
    // this.timeRemaining = 30; // ELIMINADO - Ya no se necesita
    this.category = ""; // Categoría seleccionada
    this.startTime = null; // Timestamp de inicio del juego
    this.endTime = null; // Timestamp de fin del juego
    this.totalTimeTaken = 0; // Tiempo total jugado en segundos
  }

  // Inicializa el juego, obtiene preguntas del backend
  async init(category) {
    console.log("Inicializando juego con categoría:", category);
    this.category = category; // Guardar objeto categoría completo
    this.startTime = Date.now(); // Registrar tiempo de inicio
    this.questionIndex = 0; // Reiniciar índice
    this.score = 0; // Reiniciar puntuación
    this.correctAnswers = 0; // Reiniciar contador
    this.consecutiveCorrectAnswers = 0; // Reiniciar racha
    this.maxConsecutiveCorrectAnswers = 0; // Reiniciar racha máxima

    try {
      const categoryName = category ? category.name.toLowerCase() : "variado";
      const response = await fetch("http://localhost:8003/generateQuestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryName,
          questionCount: 4, // Número de preguntas a solicitar
        }),
      });

      console.log("Response status from /generateQuestions:", response.status);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch questions: ${response.status} ${response.statusText}`
        );
      }

      // Parsear la respuesta JSON directamente
      const data = await response.json();
      console.log("Parsed questions data:", data);

      // Asumiendo que data.questions es el array esperado
      if (data && Array.isArray(data.questions)) {
        // Mapear la estructura recibida a nuestras clases Question/Answer
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

      // Fallback a preguntas de prueba si el parseo falla o no devuelve preguntas
      if (!this.questions || this.questions.length === 0) {
        console.warn(
          "No se obtuvieron/parsearon preguntas del servidor, cargando preguntas de prueba"
        );
        await this.TestingInit(); // Carga preguntas de prueba
      }

      console.log("Preguntas guardadas en el objeto Game:", this.questions);
    } catch (error) {
      console.error("Error fetching or parsing questions:", error.message);
      // Si falla la carga, usar preguntas de prueba
      await this.TestingInit();
    }
  }

  // Carga preguntas de prueba (sin cambios)
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
    // Asegurar que startTime se registre también en modo prueba si no se hizo antes
    if (!this.startTime) {
      this.startTime = Date.now();
    }
  }

  // Termina el juego, calcula tiempo y guarda resultados (sin cambios)
  async endGame() {
    this.endTime = Date.now();
    if (!this.startTime) {
      console.error(
        "Error: El tiempo de inicio no está registrado para calcular el total."
      );
      this.totalTimeTaken = 0; // O algún valor por defecto
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
        // URL del servicio de historial
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Considerar enviar el username en el body o como header seguro si aplica
          // username: username, // Ejemplo si se espera como header
        },
        body: JSON.stringify({
          // gameId: `gm${Date.now().toString(36).slice(-3)}${Math.random().toString(36).substr(2, 3)}`, // ID generado en backend preferiblemente
          username: username,
          score: this.score,
          correctQuestions: this.correctAnswers,
          category: this.category?.name || "General", // Usar nombre de categoría
          timeTaken: this.totalTimeTaken,
          totalQuestions: this.questions.length, // Enviar total de preguntas
          maxStreak: this.maxConsecutiveCorrectAnswers, // Enviar racha máxima
        }),
      });

      if (!response.ok) {
        const errorData = await response.text(); // Leer cuerpo del error
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

  // Devuelve el texto de la pregunta actual (sin cambios)
  getCurrentQuestionText() {
    if (this.questionIndex < this.questions.length) {
      return this.questions[this.questionIndex].questionText;
    }
    return "Fin del juego"; // O null
  }

  // Devuelve la racha actual (sin cambios)
  getCurrentStreak() {
    return this.consecutiveCorrectAnswers;
  }

  // Devuelve el texto de una respuesta específica (sin cambios)
  getCurrentQuestionAnswer(index) {
    if (this.questionIndex < this.questions.length) {
      return this.questions[this.questionIndex].answers[index]?.text;
    }
    return undefined;
  }

  // Devuelve la puntuación actual (sin cambios)
  getCurrentPoints() {
    return this.score;
  }

  // Procesa la respuesta del jugador o el timeout
  answerQuestion(index, isTimeout = false) {
    // Verificar si el juego ya terminó o la pregunta no existe
    if (this.questionIndex >= this.questions.length) {
      console.warn("answerQuestion called after game should have ended.");
      return; // No hacer nada si ya no hay preguntas
    }

    const currentQ = this.questions[this.questionIndex];

    // Si no es timeout, verificar la respuesta seleccionada
    if (!isTimeout) {
      // Asegurarse que el índice es válido para el array de respuestas
      if (index >= 0 && index < currentQ.answers.length) {
        if (currentQ.answers[index].isCorrect) {
          console.log("Respuesta Correcta!");
          this.correctAnswers++;
          this.consecutiveCorrectAnswers++;
          this.score += 100; // Puntos base
          this.score += this.consecutiveCorrectAnswers * 20; // Bonus por racha
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

  // Devuelve el objeto de la pregunta actual (sin cambios)
  getCurrentQuestion() {
    // Devuelve la pregunta actual o undefined si el índice está fuera de rango
    return this.questions[this.questionIndex];
  }

  // Parsea las preguntas desde el string JSON (mejorado)
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
        .filter((q) => q !== null); // Filtrar preguntas inválidas
    } catch (error) {
      console.error(
        "Error parsing questions JSON:",
        error,
        "Input string:",
        inputString
      );
      // Devolver array vacío o lanzar error según prefieras
      return [];
      // throw new Error("No se pudieron parsear las preguntas desde el servidor.");
    }
  }
}

export default Game;
