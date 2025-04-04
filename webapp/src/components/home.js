import React, { useState, useEffect } from "react";
import { Box, Typography, Snackbar, Button, Paper } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import StatisticsWindow from "./StatisticsWindow";
import GameWindow from "./GameWindow";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || "Student";
  const [showStatistics, setShowStatistics] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  
  const apiEndpoint = process.env.REACT_APP_LLM;
  const apiKey = process.env.LLM_API_KEY;

  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      try {
        console.log("REACT_APP_LLM:", process.env.REACT_APP_LLM);

        const question = `Please, generate a greeting message for a student called ${username} that is a student of the Software Architecture course in the University of Oviedo. Be nice and polite. Two to three sentences max.`;
        const response = await axios.post(`${apiEndpoint}/ask`, {
          question,
          apiKey,
        });
        setWelcomeMessage(response.data.answer);
      } catch (error) {
        console.error("Error fetching message:", error);
        setError("Failed to fetch welcome message.");
      }
    };
    fetchWelcomeMessage();
  }, [username, apiEndpoint, apiKey]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#EEF7FF",
        color: "#4D869C",
      }}
    >

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

        <Box sx={{ position: "relative", width: 600, height: 550 }}>
          <Box
            sx={{
              width: 600,
              height: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src="/WichatAmigos.png"
              alt="Game"
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            />
          </Box>
        </Box>

        <Box
          elevation={0}
          sx={{
            width: 500,
            height: 600,
            p: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            color: "#000000",
            position: "relative",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              mb: 1,
              textAlign: "center",
              color: "#000000",
            }}
          >
            Bienvenida
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontSize: "1.2rem",
              textAlign: "justify",
              overflowY: "auto",
              maxHeight: "500px",
            }}
          >
            {welcomeMessage}
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/game")}
            sx={{
              position: "absolute",
              bottom: 32,        
              left: "50%",
              transform: "translateX(-50%)",
              px: 5,
              py: 1.5,
              fontSize: "1.1rem",
              borderRadius: "12px",
              backgroundColor: "#1E90FF",
              color: "#fff",
              fontFamily: "Poppins, sans-serif",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
              '&:hover': {
                backgroundColor: "#3a6d81",
              },
            }}
          >
            🎮 Empezar a Jugar
          </Button>
        </Box>


      </Box>

      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} message={error} />
      )}
    </Box>
  );
};

export default Home;
