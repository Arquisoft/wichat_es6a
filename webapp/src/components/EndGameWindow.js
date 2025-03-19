import React, { useEffect } from "react";
import { Container, Typography, Grid, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import WhatshotIcon from "@mui/icons-material/Whatshot"; // 🔥 Icono de fuego

export default function ScoreWindow() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extraer valores del estado de navegación
  const { score = 0, correctAnswers = 0, totalQuestions = 0, streak = 0 } = location.state || {};

  useEffect(() => {
    console.log("Juego finalizado - Mostrando resultados", { score, correctAnswers, totalQuestions, streak });
  }, [score, correctAnswers, totalQuestions, streak]);

  return (
    <Container component="main" maxWidth={false} sx={{ width: "100%", minHeight: "100vh", paddingTop: 8 }}>
      <Navbar />

      <Grid
        container
        direction="column"
        justifyContent="center"
        alignItems="center"
        sx={{
          height: "calc(100vh - 64px)",
          textAlign: "center",
          background: "#f8f9fa",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          ¡Partida Finalizada!
        </Typography>

        {/* Puntuación Total */}
        <Typography variant="h6">Puntuación total:</Typography>
        <Typography variant="h3" fontWeight="bold" sx={{ my: 2 }}>
          {score} puntos
        </Typography>

        {/* Respuestas Correctas */}
        <Typography variant="h6">Respuestas correctas:</Typography>
        <Typography variant="h3" fontWeight="bold" sx={{ my: 2 }}>
          {correctAnswers} / {totalQuestions}
        </Typography>

        {/* Mejor Racha de Respuestas Correctas */}
        <Typography variant="h6">Mejor racha de respuestas correctas:</Typography>
        <Grid item container justifyContent="center" alignItems="center">
          <WhatshotIcon color="error" sx={{ fontSize: 40 }} />
          <Typography variant="h3" fontWeight="bold" color="error" sx={{ ml: 1 }}>
            {streak}
          </Typography>
        </Grid>

        {/* Botones */}
        <Grid item container justifyContent="center" spacing={2} sx={{ mt: 3 }}>
          <Grid item>
            <Button variant="contained" color="primary" onClick={() => navigate("/game")}>
              Volver a jugar
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="secondary" onClick={() => navigate("/statistics")}>
              Estadísticas
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="error" onClick={() => navigate("/home")}>
              Menú Principal
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
