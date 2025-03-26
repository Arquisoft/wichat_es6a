import React, { useState, useEffect } from "react";
import { Box, Typography, Snackbar, Button, Paper } from "@mui/material";
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
    backgroundColor: "#121212",
    color: "#e0e0e0",
  }}
>
      <Navbar />

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          gap: 4,
          px: 4,
          flexWrap: "wrap",
        }}
      >
        {/* Cuadro 1: mensaje LLM */}
        <Paper
          elevation={6}
          sx={{
            width: 300,
            height: 350,
            p: 3,
            backgroundColor: "#1e1e1e",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            color: "#f0f0f0",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", mb: 1, textAlign: "center", color: "#90caf9" }}
          >
            Bienvenida
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontSize: "0.95rem", textAlign: "justify" }}
          >
            {welcomeMessage}
          </Typography>
        </Paper>

        {/* Cuadro 2: imagen */}
        <Paper
          elevation={6}
          sx={{
            width: 300,
            height: 350,
            p: 2,
            backgroundColor: "#1e1e1e",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#f0f0f0",
          }}
        >
          <Box
            component="img"
            src="/WichatAmigos.png"
            alt="Game"
            sx={{ width: "80%", height: "auto", mb: 2 }}
          />
          
        </Paper>

        {/* Cuadro 3: botones */}
        <Paper
          elevation={6}
          sx={{
            width: 300,
            height: 350,
            p: 3,
            backgroundColor: "#1e1e1e",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            color: "#f0f0f0",
          }}
        >
          <Button
            variant="contained"
            sx={{ backgroundColor: "#90caf9", color: "#000", fontWeight: "bold" }}
            onClick={() => navigate("/home")}
          >
            Home
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#90caf9", color: "#000", fontWeight: "bold" }}
            onClick={() => navigate("/game")}
          >
            Jugar
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#90caf9", color: "#000", fontWeight: "bold" }}
            onClick={() => navigate("/statistics")}
          >
            Stats
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#90caf9", color: "#000", fontWeight: "bold" }}
            onClick={() => navigate("/ranking")}
          >
            Ranking
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => navigate("/")}
            sx={{
              borderColor: "#f44336",
              color: "#f44336",
              fontWeight: "bold",
            }}
          >
            Logout
          </Button>
        </Paper>
      </Box>

      {error && <Snackbar open={!!error} autoHideDuration={6000} message={error} />}
    </Box>
  );
};

export default Home;
