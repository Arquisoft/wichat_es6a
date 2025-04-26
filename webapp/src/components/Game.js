// src/components/Game.js
class Answer {
  constructor(text, isCorrect) {
    this.text = text;
    this.isCorrect = isCorrect;
  }
}

class Question {
  constructor(questionText, answers, imageUrl) {
    this.questionText = questionText;
    this.answers = answers; // Debe ser un array de instancias de Answer
    this.imageUrl = imageUrl;
  }
}

// Clase principal del juego
class Game {
  constructor(navigate) {
    this.questions = [];
    this.questionIndex = 0;
    this.score = 0;
    this.navigate = navigate; // Función para navegar al final
    this.consecutiveCorrectAnswers = 0;
    this.correctAnswers = 0;
    this.maxConsecutiveCorrectAnswers = 0;
    this.category = ""; // Categoría seleccionada
    this.startTime = null;
    this.endTime = null;
    this.totalTimeTaken = 0;
    this.difficulty = "Not set"; // Dificultad seleccionada
    this.totalQuestions = 0; // Total de preguntas a responder

    // Set para rastrear en qué preguntas se usó el 50/50 (para puntuación)
    this.usedFiftyFiftyOn = new Set();

    this.usedHintOn = new Set();
    this.usedAskAIOn = new Set();


  }

  // Método de inicialización modificado para aceptar questionCount
  async init(category, difficulty) {
    // Default a 5 (Medio) si no se provee
    this.totalQuestions = difficulty.questionCount || 5
    var questionCount = this.totalQuestions; // Guardar el total de preguntas
    this.difficulty = difficulty || "Not set";
    console.log(
      `Inicializando juego con categoría: ${
        category?.name || "Variado"
      } y ${this.totalQuestions} preguntas.`
    );
    this.category = category; // Guardar la categoría
    this.startTime = Date.now(); // Registrar tiempo de inicio
    // Resetear estado del juego
    this.questionIndex = 0;
    this.score = 0;
    this.correctAnswers = 0;
    this.consecutiveCorrectAnswers = 0;
    this.maxConsecutiveCorrectAnswers = 0;
    this.questions = []; // Limpiar preguntas de partidas anteriores
    this.usedFiftyFiftyOn = new Set(); // Limpiar set de 50/50

    // --- Carga de preguntas desde el Backend (generadas) ---
    try {
      const categoryName = category ? category.name.toLowerCase() : "variado";
      console.log(
        `Workspaceing ${this.totalQuestions} questions for category ${categoryName} from backend...`
      );

      const response = await fetch("http://localhost:8000/generateQuestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryName,
          questionCount: this.totalQuestions,
        }),
      });

      console.log("Response status from /generateQuestions:", response.status);
      if (!response.ok) {
        const errorText = await response.text(); // Intentar leer cuerpo del error
        console.error(
          "Error response body from /generateQuestions:",
          errorText
        );
        throw new Error(
          `Failed to fetch questions: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Parsed questions data:", data);

      // Parsear y mapear la respuesta a las clases Question y Answer
      if (data && Array.isArray(data.questions)) {
        this.questions = data.questions
          .map((qData) => {
            // Validar estructura mínima de qData
            if (
              !qData ||
              typeof qData.question !== "string" ||
              !Array.isArray(qData.answers)
            ) {
              console.warn(
                "Skipping invalid question data structure from backend:",
                qData
              );
              return null; // Marcar para filtrar después
            }
            const answers = qData.answers.map((aData) => {
              // Validar estructura mínima de aData y asegurar que isCorrect sea booleano
              const isCorrect =
                typeof aData?.isCorrect === "boolean"
                  ? aData.isCorrect
                  : String(aData?.isCorrect).toLowerCase() === "true";
              return new Answer(aData?.text || "Respuesta inválida", isCorrect);
            });
      
            // Filtrar respuestas potencialmente inválidas si es necesario
            const validAnswers = answers.filter(
              (a) => a.text !== "Respuesta inválida"
            );
      
            // Asegurar que hay 4 respuestas válidas y al menos una correcta
            if (validAnswers.length !== 4) {
              console.warn(
                `Question "${qData.question}" has ${validAnswers.length} valid answers, expected 4. Skipping.`
              );
              return null;
            }
            if (!validAnswers.some((a) => a.isCorrect)) {
              console.warn(
                `Question "${qData.question}" has no correct answer marked. Skipping.`
              );
              return null;
            }
      
            // Barajar respuestas usando Fisher-Yates para que la correcta no esté siempre en la misma posición
            const shuffledAnswers = [...validAnswers]; // Crear una copia para no mutar el original
            for (let i = shuffledAnswers.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1)); // Elegir índice aleatorio
              [shuffledAnswers[i], shuffledAnswers[j]] = [shuffledAnswers[j], shuffledAnswers[i]]; // Intercambiar elementos
            }
      
            const imageUrl = qData.imageUrl || null;
            return new Question(qData.question, shuffledAnswers, imageUrl);
          })
          .filter((q) => q !== null); // Filtrar preguntas nulas (inválidas o saltadas)
      } else {
        console.error("Formato inesperado recibido de /generateQuestions:", data);
        throw new Error("Formato de preguntas inesperado.");
      }

      // Fallback si, después de todo el proceso, no hay preguntas válidas
      if (!this.questions || this.questions.length === 0) {
        console.warn(
          "No se obtuvieron/parsearon preguntas válidas del servidor, cargando preguntas de prueba."
        );
        await this.TestingInit(questionCount);
      }

      console.log("Preguntas guardadas en el objeto Game:", this.questions);
    } catch (error) {
      console.error("Error fetching or parsing questions:", error.message);
      // Fallback a preguntas de prueba si falla la carga principal
      await this.TestingInit(questionCount);
    }
  }

  /* --- COMENTADO: Carga desde DB (mantener comentado según original) ---
  async loadQuestionsFromDB(category = "", questionCount = 5) {
    try {
      const isVariado = category.toLowerCase() === "variado";
      const categoryParam = !isVariado && category
        ? `?category=${encodeURIComponent(category)}`
        : "";

      const response = await fetch(`http://localhost:8005/questions${categoryParam}`);

      if (!response.ok) {
        throw new Error(`Error loading questions from DB: ${response.statusText}`);
      }

      const allQuestions = await response.json();

      if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
        throw new Error("Didn't receive valid questions from db.");
      }

      // Usar questionCount para seleccionar el número correcto de preguntas
      const selectedQuestions = allQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, questionCount); // <--- Aplicar questionCount aquí

      this.questions = selectedQuestions.map((q) => {
        const answers = [
          new Answer(q.correctAnswer, true),
          ...q.incorrectAnswers.map((ia) => new Answer(ia, false)),
        ];

        const shuffledAnswers = answers.sort(() => Math.random() - 0.5);
        return new Question(q.question, shuffledAnswers);
      });

      console.log("Loaded questions from db:", this.questions);
    } catch (err) {
      console.error("Error in loadQuestionsFromDB:", err.message);
      await this.TestingInit(questionCount); // Fallback con questionCount
    }
  }
  */

  // Método de fallback
  TestingInit(questionCount = 4) {
    console.log(
      `Modo de prueba activado: Cargando ${questionCount} preguntas predefinidas`
    );
    const allTestQuestions = [
      new Question(
        "¿Cuál es la capital de Francia?",
        [
          new Answer("Madrid", false),
          new Answer("París", true),
          new Answer("Berlín", false),
          new Answer("Lisboa", false),
        ],
        null
      ),
      new Question(
        "¿Quién escribió 'Don Quijote de la Mancha'?",
        [
          new Answer("Miguel de Cervantes", true),
          new Answer("Gabriel García Márquez", false),
          new Answer("William Shakespeare", false),
          new Answer("Federico García Lorca", false),
        ],
        null
      ),
      new Question(
        "¿En qué año llegó el ser humano a la Luna?",
        [
          new Answer("1969", true),
          new Answer("1975", false),
          new Answer("1965", false),
          new Answer("1980", false),
        ],
        null
      ),
      new Question(
        "¿Cuál es el océano más grande del mundo?",
        [
          new Answer("Atlántico", false),
          new Answer("Índico", false),
          new Answer("Pacífico", true),
          new Answer("Ártico", false),
        ],
        null
      ),
      new Question(
        "¿Cuál es el río más largo del mundo?",
        [
          new Answer("Nilo", false),
          new Answer("Amazonas", true),
          new Answer("Misisipi", false),
          new Answer("Yangtsé", false),
        ],
        null
      ),
      new Question(
        "¿Cuántos lados tiene un hexágono?",
        [
          new Answer("5", false),
          new Answer("7", false),
          new Answer("6", true),
          new Answer("8", false),
        ],
        null
      ),
    ];

    // Barajar y seleccionar el número correcto de preguntas de prueba
    this.questions = allTestQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, questionCount);

    console.log("Preguntas de prueba cargadas:", this.questions);
    // Asegurar que startTime se registre si no se hizo antes
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
      this.totalTimeTaken = Math.floor((this.endTime - this.startTime) / 1000); // Tiempo en segundos
    }
    console.log(
      "Tiempo total de la partida (en segundos):",
      this.totalTimeTaken
    );

    // --- Guardar resultados en el backend ---
    try {
      const username = localStorage.getItem("username");
      if (!username) throw new Error("No username found in localStorage");

      const response = await fetch("http://localhost:8010/addGame", {
        // Endpoint para guardar partida
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Generar un ID único simple para la partida
          gameId: `gm${Date.now().toString(36).slice(-3)}${Math.random()
            .toString(36)
            .substr(2, 3)}`,
          username: username,
          score: this.score || 0,
          correctQuestions: this.correctAnswers || 0,
          category: this.category?.name || "General",
          timeTaken: this.totalTimeTaken,
          maxStreak: this.maxConsecutiveCorrectAnswers,
          totalQuestions: this.questions.length,
          difficulty: this.difficulty.name,
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

    // --- Navegar a la pantalla de fin de juego ---
    if (this.navigate) {
      this.navigate("/endGame", {
        state: {
          score: this.score || 0,
          correctAnswers: this.correctAnswers || 0,
          totalQuestions: this.questions.length || 0,
          streak: this.maxConsecutiveCorrectAnswers || 0,
          timeTaken: this.totalTimeTaken,
          category: this.category?.name || "General",
          difficulty: this.difficulty.name,
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
    return "Fin del juego"; // Mensaje si se intenta acceder después del final
  }

  // Devuelve la racha actual
  getCurrentStreak() {
    return this.consecutiveCorrectAnswers;
  }

  getCurrentQuestionImageUrl() {
    if (this.questionIndex < this.questions.length) {
      return this.questions[this.questionIndex].imageUrl;
    }
    return null;
  }
  // Devuelve el texto de una respuesta específica por índice
  getCurrentQuestionAnswer(index) {
    if (this.questionIndex < this.questions.length) {
      if (
        index >= 0 &&
        index < this.questions[this.questionIndex].answers.length
      ) {
        return this.questions[this.questionIndex].answers[index]?.text;
      }
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

      return; // No procesar más
    }

    const currentQ = this.questions[this.questionIndex];
    let wasCorrect = false; // Variable para saber si fue correcta

    // Si NO es timeout, verificar la respuesta seleccionada
    if (!isTimeout) {
      // Asegurarse que el índice es válido
      if (index >= 0 && index < currentQ.answers.length) {
        if (currentQ.answers[index].isCorrect) {
          console.log("Respuesta Correcta!");
          wasCorrect = true;
          this.correctAnswers++;
          this.consecutiveCorrectAnswers++;

          // Cálculo de puntos: base + bonus por racha, penalización por 50/50
          let basePoints = 100;
          // Reducir puntos si se usó 50/50 en esta pregunta específica
          if (this.usedFiftyFiftyOn.has(currentQ.questionText)) {
            basePoints = basePoints - 40;
          }
          if (this.usedHintOn.has(currentQ.questionText)) {
            basePoints = basePoints - 15;
          }
          if (this.usedAskAIOn.has(currentQ.questionText)) {
            basePoints = basePoints - 25;

          }
          this.score += basePoints;

          // Bonus por racha (a partir de la 2ª respuesta correcta consecutiva)
          if (this.consecutiveCorrectAnswers > 1) {
            const streakBonus = (this.consecutiveCorrectAnswers - 1) * 20;
            this.score += streakBonus;
            console.log(`Bonus por racha (+${streakBonus})`);
          }

          // Actualizar racha máxima si la actual es mayor
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
        // Índice inválido (ej. -1 por timeout o error) se considera incorrecto
        console.error(
          `Índice de respuesta inválido (${index}) para la pregunta actual. Considerado incorrecto.`
        );
        this.consecutiveCorrectAnswers = 0; // Romper racha
      }
    } else {
      // Si ES timeout, simplemente romper la racha (ya no se suma puntuación)
      console.log("Timeout!");
      this.consecutiveCorrectAnswers = 0;
    }

    // Avanzar a la siguiente pregunta SIEMPRE después de procesar la actual
    this.questionIndex++;

    // Comprobar si el juego ha terminado DESPUÉS de avanzar el índice
    if (this.questionIndex >= this.questions.length) {
      console.log("Última pregunta respondida/timeout. Finalizando juego...");
      // Llamar a endGame() SOLO si ya no hay más preguntas
      // Usar un pequeño timeout para permitir que la UI muestre el feedback final
      setTimeout(() => {
        if (!this.endTime) {
          // Evitar llamar endGame múltiples veces
          this.endGame();
        }
      }, 0); // 0ms timeout para ponerlo al final de la cola de eventos actual
    }

    // Devolver si la respuesta fue correcta podría ser útil para la UI
    // return wasCorrect; // Descomentar si GameWindow necesita saberlo inmediatamente
  }

  // Devuelve el objeto Question completo de la pregunta actual
  getCurrentQuestion() {
    // Devuelve la pregunta actual o undefined si el índice está fuera de rango
    return this.questions[this.questionIndex];
  }

  // Marcar que se usó 50/50 en la pregunta actual
  useFiftyFifty() {
    const current = this.getCurrentQuestion();
    if (current) {
      // Usar el texto de la pregunta como clave única en el Set
      this.usedFiftyFiftyOn.add(current.questionText);
      console.log(`50/50 usado en pregunta: "${current.questionText}"`);
    }
  }

  /* --- COMENTADO: parseQuestions  ---
  // Parsea las preguntas desde el string JSON (útil si el backend devolviera un string)
  parseQuestions(inputString) {
    try {
      // Limpieza básica inicial
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
        .filter((q) => q !== null); // Filtrar los nulos
    } catch (error) {
      console.error(
        "Error parsing questions JSON:",
        error,
        "Input string:",
        inputString
      );
      return []; // Devolver array vacío en caso de error de parseo
    }
  }
  */
  
  useHint() {
    const current = this.getCurrentQuestion();
    if (current) {
      this.usedHintOn.add(current.questionText);
    }
  }
  
  useAskAI() {
    const current = this.getCurrentQuestion();
    if (current) {
      this.usedAskAIOn.add(current.questionText);
    }
  }
  
}

export default Game;
