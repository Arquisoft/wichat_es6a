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
        console.log("Iniciando fetch de preguntas...");
        try {
            const response = await fetch("http://localhost:8003/generateQuestions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ context: "Historia universal" })  
            });
    
            if (!response.ok) throw new Error("Failed to fetch questions");
    
            const data = await response.json();
            console.log("Preguntas recibidas:", data); 
    
            // Asignar preguntas correctamente
            this.questions = data.questions.map(q =>
                new Question(
                    q.question,
                    q.answers.map(a => new Answer(a.text, a.correct))
                )
            );
    
            console.log("Preguntas guardadas en el objeto Game:", this.questions);
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
    }    
    
  
    endGame() {
        if (this.navigate) {
            this.navigate("/game-over");
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
  }
  
  export default Game;