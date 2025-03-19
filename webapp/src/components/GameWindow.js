import React, { useEffect, useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import { Typography, Button, Paper } from "@mui/material";
import ChatClues from "./ChatClues";
import Game from "./Game";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function GameWindow() {
  const navigate = useNavigate();
  const gameRef = useRef(new Game(navigate));
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [points, setPoints] = useState(0);
  const isInitializedRef = useRef(false);
  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const apiKey = process.env.LLM_API_KEY;
  const chatCluesRef = useRef(null);

  useEffect(() => {
    const initializeGame = async () => {
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      await gameRef.current.init();
      console.log("Game iniciado:", gameRef.current);
      setCurrentQuestion(gameRef.current.getCurrentQuestion());
      setPoints(gameRef.current.getCurrentPoints());
    };

    initializeGame();
  }, []);

  const handleAnswerClick = (index) => {
    gameRef.current.answerQuestion(index);
    setCurrentQuestion(gameRef.current.getCurrentQuestion());
    setPoints(gameRef.current.getCurrentPoints());
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
      {/* Panel de chat a la izquierda */}
      <ChatClues
        ref={chatCluesRef}
        question={currentQuestion?.questionText}
        answers={currentQuestion?.answers}
      />

      {/* Contenido principal a la derecha */}
      <Grid item xs={9} container direction="column" sx={{ p: 3, mx: "auto" }}>
        {/* Encabezado: número de pregunta y botón de pista a la derecha */}
        <Grid
          item
          container
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h5" fontWeight="bold">
            Question {gameRef.current.questionIndex + 1}/
            {gameRef.current.questions.length}
          </Typography>
          <Button variant="outlined" onClick={handleGetHint}>
            Get Hint
          </Button>
        </Grid>

        {/* Imagen */}
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

        {/* Texto de la pregunta y puntos */}
        <Grid item container justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">
            {currentQuestion ? currentQuestion.questionText : "Cargando..."}
          </Typography>
          <Typography variant="h6" color="primary">
            Points: {points}
          </Typography>
        </Grid>

        {/* Opciones de respuesta */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {currentQuestion &&
            currentQuestion.answers.map((answer, index) => (
              <Grid item xs={6} key={index}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ borderRadius: 2 }}
                  onClick={() => handleAnswerClick(index)}
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
