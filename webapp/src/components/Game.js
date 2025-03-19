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
    }
  
    async init() {
        console.log("Cambio realizado");
        try {
            // Paso 1: Realizar la solicitud fetch
            const response = await fetch("http://localhost:8003/generateQuestions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ context: "Historia universal" })  
            });

            // Paso 2: Verificar si la respuesta es exitosa
            console.log("Response:", response);
            if (!response.ok) {
                throw new Error(`Failed to fetch questions: ${response.status} ${response.statusText}`);
            }
    
            // Paso 3: Leer y parsear el cuerpo de la respuesta como JSON
            const textData = await response.text();
            const data = JSON.parse(textData);
            var stringData = JSON.stringify(data);
            stringData = stringData
            .replace(/^```jso/, '') // Elimina "```jso" del inicio
            .replace(/```$/, '') // Elimina "```" del final
            .replace(/\\n|\\/g, '') // Elimina todos los \n, \ y letras n innecesarias
            .replace(/\\"/g, '"') // Convierte las comillas escapadas `\"` en comillas normales `"`.
          
            console.log(stringData);
    
            this.questions = this.parseQuestions(stringData);
    
            console.log("Preguntas guardadas en el objeto Game:", this.questions);
        } catch (error) {
            console.error("Error fetching questions:", error.message);
        }
    }    

    async TestingInit() {
      console.log("Modo de prueba activado: Cargando preguntas predefinidas");
  
      // Preguntas predefinidas
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
        if (this.navigate) {
            this.navigate("/");
        }
    }
  
    getCurrentQuestionText() {
        return this.questions[this.questionIndex].questionText;
    }
  
    getCurrentQuestionAnswer(index) {
        return this.questions[this.questionIndex].answers[index]?.text;
    }

    getCurrentPoints() {
        return this.score;
    }
  
    answerQuestion(index) {
        if (
            this.questionIndex < this.questions.length &&
            this.questions[this.questionIndex].answers[index]
        ) {
            if (this.questions[this.questionIndex].answers[index].isCorrect) {
                this.score += 100;
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
        // Limpiar el string eliminando los caracteres no deseados
        const cleanedString = inputString
          .replace(/^```json/, '') // Elimina "```json" del inicio
          .replace(/```$/, '') // Elimina "```" del final
          .trim(); // Elimina espacios innecesarios
      
        // Extraer preguntas y respuestas con expresiones regulares
        const questionBlocks = cleanedString.match(/"question":\s*"([^"]+)",\s*"answers":\s*\[(.*?)\]/gs);
      
        if (!questionBlocks) {
          throw new Error("No se encontraron preguntas en el texto.");
        }
      
        const questions = questionBlocks.map(block => {
          // Extraer el texto de la pregunta
          const questionMatch = block.match(/"question":\s*"([^"]+)"/);
          const questionText = questionMatch ? questionMatch[1] : "";
      
          // Extraer respuestas
          const answersMatch = block.match(/"answers":\s*\[(.*?)\]/);
          const answersText = answersMatch ? answersMatch[1] : "";
      
          // Extraer cada respuesta y su valor "correct"
          const answerObjects = [...answersText.matchAll(/\{[^}]*"text":\s*"([^"]+)",\s*"correct":\s*(true|false)[^}]*\}/g)]
            .map(match => new Answer(match[1], match[2] === "true"));
      
          return new Question(questionText, answerObjects);
        });
      
        return questions;
      }
  }
  
  export default Game;