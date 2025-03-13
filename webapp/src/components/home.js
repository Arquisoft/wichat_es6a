import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Typography,
  Box,
  Snackbar,
} from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import StatisticsWindow from "./StatisticsWindow";
import GameWindow from "./GameWindow";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || "Student";
  const [showStatistics, setShowStatistics] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [error, setError] = useState("");

  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8003";
  const apiKey = "sk-e3KdtE0TwhZqrDbupyhTug";

  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      try {
        console.log("Process ENV:", process.env);
        console.log("Fetching message...");
        console.log("API Key:", apiKey);
        console.log("API Endpoint:", apiEndpoint);

        const question = `Please, generate a greeting message for a student called ${username} that is a student of the Software Architecture course in the University of Oviedo. Be nice and polite. Two to three sentences max.`;
        const model = "empathy";
        console.log("Sending welcome message request with payload:", {
          question,
          apiKey,
        });
        const response = await axios.post(`${apiEndpoint}/ask`, {
          question,
          apiKey,
        });

        console.log("API Response:", response.data);
        setWelcomeMessage(response.data.answer);
      } catch (error) {
        console.error("Error fetching message:", error);
        setError("Failed to fetch welcome message.");
      }
    };

    fetchWelcomeMessage();
  }, [username, apiEndpoint, apiKey]);

  const handlePlayClick = () => {
    setShowGame(true);
    setShowStatistics(false);
  };

  const handleHomeClick = () => {
    setShowGame(false);
    setShowStatistics(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: 'url("/fondoHome.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <AppBar position="static" sx={{ backgroundColor: "#1976d2" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/")}
          >
            <HomeIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Home Page
          </Typography>
          <Button
            color="inherit"
            onClick={() => setShowStatistics(!showStatistics)}
          >
            {showStatistics ? "Home" : "Stats"}
          </Button>
          <Button color="inherit" onClick={handlePlayClick}>
            Play
          </Button>
          <Button color="inherit" onClick={handleHomeClick}>
            Home
          </Button>
          <Button color="inherit" onClick={() => navigate("/")}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Container eliminado, reemplazado por Box */}
      <Box sx={{ textAlign: "center", paddingTop: 4 }}>
        <Typography variant="h5">{welcomeMessage}</Typography>

        {showStatistics && <StatisticsWindow />}
        {showGame && <GameWindow />}

        {!showStatistics && !showGame && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 3,
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              backgroundColor: "#f9f9f9",
              marginTop: 3,
            }}
          >
            <Box
              component="img"
              src="/WichatAmigos.png"
              alt="Game Description"
              sx={{
                maxWidth: "100%",
                height: "auto",
                marginBottom: 2,
              }}
            />
            <Typography
              variant="body1"
              sx={{ textAlign: "justify", fontSize: "1rem" }}
            >
              Wichat es un juego digital de trivia diseñado para poner a prueba
              tus conocimientos y habilidades de pensamiento rápido. Reúne a tus
              amigos y familiares para disfrutar de horas de diversión y
              aprendizaje. Con una amplia variedad de preguntas en diversas
              categorías, cada partida es una nueva oportunidad para descubrir
              datos interesantes y curiosidades. ¡Prepárate para desafiar tus
              límites y convertirte en el campeón de Wichat!
            </Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} message={error} />
      )}
    </Box>
  );
};

export default Home;
