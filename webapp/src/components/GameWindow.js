import React, { useEffect, useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import { Typography, Button, Paper, AppBar, Toolbar, IconButton } from "@mui/material";
import { Home as HomeIcon, Whatshot as WhatshotIcon } from "@mui/icons-material";
import ChatClues from "./ChatClues";
import Game from "./Game";
import { useNavigate } from "react-router-dom";

export function GameWindow() {
  const navigate = useNavigate();
  const gameRef = useRef(new Game(navigate)); 
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const initializeGame = async () => {
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      await gameRef.current.init();
      setCurrentQuestion(gameRef.current.getCurrentQuestion());
      setPoints(gameRef.current.getCurrentPoints());
      setStreak(gameRef.current.getCurrentStreak());
    };

    initializeGame();
  }, []);

  const handleAnswerClick = (index) => {
    gameRef.current.answerQuestion(index);
    setCurrentQuestion(gameRef.current.getCurrentQuestion());
    setPoints(gameRef.current.getCurrentPoints());
    setStreak(gameRef.current.getCurrentStreak());
  };

  return (
    <Grid container sx={{ bgcolor: "#f4f4f4", p: 2 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate("/")}>
            <HomeIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Home Page
          </Typography>

          <Button color="inherit" onClick={() => navigate("/game")}>
            Jugar
          </Button>

          <Button color="inherit" onClick={() => navigate("/ranking")}>
            Ranking
          </Button>

          <Button color="inherit" onClick={() => navigate("/statistics")}>
            Stats
          </Button>

          <Button color="inherit" onClick={() => navigate("/home")}>
            Home
          </Button>

          <Button color="inherit" onClick={() => navigate("/")}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <ChatClues />

      {/* Contenedor Principal */}
      <Grid item xs={9} container direction="column" sx={{ p: 3, mx: "auto" }}>
        {/* Botones de Info y Exit */}
        <Grid item container justifyContent="flex-end" spacing={1} sx={{ mb: 2 }}>
          <Grid item>
            <Button variant="contained" color="primary">Hint</Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="error" onClick={() => gameRef.current.endGame()}>
              Exit
            </Button>
          </Grid>
        </Grid>

        {/* Pregunta */}
        <Grid item sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Question {gameRef.current.questionIndex + 1}/{gameRef.current.questions.length}
          </Typography>
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

        {/* Pregunta, Puntuación y Racha */}
        <Grid item container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
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

        {/* Respuestas */}
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
