import React, { useEffect, useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import { Typography, Button, Paper } from "@mui/material";
import { Whatshot as WhatshotIcon } from "@mui/icons-material";
import ChatClues from "./ChatClues";
import Game from "./Game";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import axios from "axios";

export function GameWindow() {
  const navigate = useNavigate();
  const gameRef = useRef(new Game(navigate));
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedbackColors, setFeedbackColors] = useState([]);
  const isInitializedRef = useRef(false);
  const chatCluesRef = useRef(null);
  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const apiKey = process.env.GEMINI_API_KEY;
  const [timeRemaining, setTimeRemaining] = useState(30);

  useEffect(() => {
    const initializeGame = async () => {
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      await gameRef.current.init();

      setCurrentQuestion(gameRef.current.getCurrentQuestion());
      setPoints(gameRef.current.getCurrentPoints());
      setStreak(gameRef.current.getCurrentStreak());
      gameRef.current.startTimer();
    };

    initializeGame();
  }, []);

  // Cada vez que se carga una nueva pregunta, reiniciamos el contador y el timer
  useEffect(() => {
    // Reinicia el tiempo para la nueva pregunta
    setTimeRemaining(30);
    const interval = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          if (currentQuestion && currentQuestion.answers) {
            // Obtiene el índice de la respuesta correcta
            const correctIndex = currentQuestion.answers.findIndex(
              (ans) => ans.isCorrect
            );
            // Establece los colores: verde para la correcta, rojo para las demás
            const newColors = currentQuestion.answers.map((_, i) =>
              i === correctIndex ? "#a5d6a7" : "#ef9a9a"
            );
            setFeedbackColors(newColors);
            setSelectedAnswer(correctIndex);

            setTimeout(() => {
              // Avanza a la siguiente pregunta usando la respuesta correcta y marcando timeout para no sumar puntos
              gameRef.current.answerQuestion(correctIndex, true);
              setCurrentQuestion(gameRef.current.getCurrentQuestion());
              setPoints(gameRef.current.getCurrentPoints());
              setStreak(gameRef.current.getCurrentStreak());
              setSelectedAnswer(null);
              setFeedbackColors([]);
            }, 1500);
          } else {
            gameRef.current.answerQuestion(-1, true);
            setCurrentQuestion(gameRef.current.getCurrentQuestion());
          }
          return 30;
        } else {
          return prevTime - 1;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion]);

  const handleAnswerClick = (index) => {
    if (selectedAnswer !== null) return;

    const correctIndex = currentQuestion.answers.findIndex(
      (ans) => ans.isCorrect
    );

    setSelectedAnswer(index);

    const newColors = currentQuestion.answers.map((_, i) =>
      i === correctIndex ? "#a5d6a7" : "#ef9a9a"
    );
    setFeedbackColors(newColors);

    setTimeout(() => {
      gameRef.current.answerQuestion(index);
      setCurrentQuestion(gameRef.current.getCurrentQuestion());
      setPoints(gameRef.current.getCurrentPoints());
      setStreak(gameRef.current.getCurrentStreak());
      setSelectedAnswer(null);
      setFeedbackColors([]);
    }, 1500);
  };

  const handleGetHint = async () => {
    if (
      !currentQuestion ||
      !currentQuestion.answers ||
      currentQuestion.answers.length === 0
    ) {
      chatCluesRef.current.addMessage(
        "IA: No question or answers available to get a hint."
      );
      return;
    }

    try {
      const response = await axios.post(`${apiEndpoint}/getHint`, {
        question: currentQuestion.questionText,
        answers: currentQuestion.answers.map((answer) => answer.text),
        apiKey: apiKey,
      });

      const hintMessage = `IA: ${response.data.hint}`;
      chatCluesRef.current.addMessage(hintMessage);
    } catch (error) {
      console.error("Error getting hint:", error);
      let errorMessage = "IA: Error retrieving hint. Please try again later.";
      if (error.response) {
        errorMessage = `IA: Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage =
          "IA: No response from server. Please check your connection.";
      } else {
        errorMessage = "IA: Error setting up request.";
      }
      chatCluesRef.current.addMessage(errorMessage);
    }
  };

  return (
    <Grid container sx={{ bgcolor: "#f4f4f4", p: 2 }}>
      <Navbar />
      <ChatClues
        ref={chatCluesRef}
        question={currentQuestion?.questionText}
        answers={currentQuestion?.answers}
      />

      <Grid item xs={9} container direction="column" sx={{ p: 3, mx: "auto" }}>
        <Grid
          item
          container
          justifyContent="flex-end"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Grid item>
            <Button variant="contained" color="primary" onClick={handleGetHint}>
              Hint
            </Button>
          </Grid>
        </Grid>

        <Grid item sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Question {gameRef.current.questionIndex + 1}/
            {gameRef.current.questions.length}
          </Typography>
          <Typography variant="h6">Time Remaining: {timeRemaining}s</Typography>
        </Grid>

        <Grid
          item
          component={Paper}
          elevation={3}
          sx={{
            bgcolor: "#ffffff",
            width: "50%",
            height: 450,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
            mx: "auto",
            mb: 2,
          }}
        >
          IMAGE
        </Grid>

        <Grid
          item
          container
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">
            {currentQuestion ? currentQuestion.questionText : "Cargando..."}
          </Typography>
          <Grid item display="flex" alignItems="center">
            <Typography variant="h6" color="primary" sx={{ mr: 1 }}>
              Points: {points}
            </Typography>
            <WhatshotIcon color="error" />
            <Typography variant="h6" color="error" sx={{ ml: 1 }}>
              {streak}
            </Typography>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {currentQuestion &&
            currentQuestion.answers.map((answer, index) => (
              <Grid item xs={6} key={index}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    bgcolor: feedbackColors[index] || "#1976d2",
                    color: "white",
                    border:
                      selectedAnswer === index ? "3px solid black" : "none",
                    transition: "background-color 0.3s, border 0.3s",
                    "&:disabled": {
                      bgcolor: feedbackColors[index] || "#1976d2",
                      color: "white",
                    },
                  }}
                  onClick={() => handleAnswerClick(index)}
                  disabled={selectedAnswer !== null}
                >
                  {answer.text}
                </Button>
              </Grid>
            ))}
        </Grid>
      </Grid>
    </Grid>
  );
}

export default GameWindow;
