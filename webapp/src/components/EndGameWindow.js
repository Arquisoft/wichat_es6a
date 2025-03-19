import React from "react";
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Typography,
  Container,
  Box,
} from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function ScoreWindow({ correctAnswers, totalQuestions, onRestart }) {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth={false} sx={{ width: "100%", minHeight: "100vh", paddingTop: 8 }}>
      {/* Barra de navegación */}
      <AppBar position="fixed">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate("/")}>
            <HomeIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Score
          </Typography>

          <Button color="inherit" onClick={() => navigate("/game")}>Jugar</Button>
          <Button color="inherit" onClick={() => navigate("/ranking")}>Ranking</Button>
          <Button color="inherit" onClick={() => navigate("/statistics")}>Stats</Button>
          <Button color="inherit" onClick={() => navigate("/home")}>Home</Button>
          <Button color="inherit" onClick={() => navigate("/")}>Logout</Button>
        </Toolbar>
      </AppBar>

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
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={onRestart}
        >
          Volver a jugar
        </Button>
      </Box>
    </Container>
  );
}
