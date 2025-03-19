import React, { useState, useEffect } from "react";
import { Box, Typography, Snackbar } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || "Student";
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [error, setError] = useState("");

  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8003";
  const apiKey = process.env.LLM_API_KEY;

  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      try {
        const question = `Please, generate a greeting message for a student called ${username} that is a student of the Software Architecture course in the University of Oviedo.`;
        const response = await axios.post(`${apiEndpoint}/ask`, {
          question,
          apiKey,
        });
        setWelcomeMessage(response.data.answer);
      } catch (error) {
        setError("Failed to fetch welcome message.");
      }
    };
    fetchWelcomeMessage();
  }, [username, apiEndpoint, apiKey]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: 'url("/fondoHome.png")',
        backgroundSize: "cover",
      }}
    >
      <Navbar />
      <Box sx={{ textAlign: "center", paddingTop: 4 }}>
        <Typography variant="h5">{welcomeMessage}</Typography>
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
            alt="Game"
            sx={{ maxWidth: "100%", height: "auto", marginBottom: 2 }}
          />
          <Typography variant="body1" sx={{ textAlign: "justify", fontSize: "1rem" }}>
            Wichat es un juego digital de trivia diseñado para poner a prueba tus
            conocimientos y habilidades de pensamiento rápido.
          </Typography>
        </Box>
      </Box>

      {error && <Snackbar open={!!error} autoHideDuration={6000} message={error} />}
    </Box>
  );
};

export default Home;