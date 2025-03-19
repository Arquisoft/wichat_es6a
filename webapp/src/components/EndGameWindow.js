import React from "react";
import {
  Container,
  Typography,
  Box,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function ScoreWindow({ correctAnswers, totalQuestions, onRestart }) {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth={false} sx={{ width: "100%", minHeight: "100vh", paddingTop: 8 }}>
      {/* Barra de navegación */}
      <Navbar />

      {/* Contenido */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 64px)", // Ajusta para no solaparse con la barra
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
        <Typography variant="h6">Has respondido correctamente:</Typography>
        <Typography variant="h3" fontWeight="bold" sx={{ my: 2 }}>
          {correctAnswers} / {totalQuestions}
        </Typography>
        
        <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/game")}
          >
            Volver a jugar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate("/statistics")}
          >
            Estadísticas
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => navigate("/home")}
          >
            Menú Principal
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
