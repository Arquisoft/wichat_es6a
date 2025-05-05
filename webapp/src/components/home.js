// src/components/Home.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Snackbar,
  Button,
  keyframes,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import PersonIcon from "@mui/icons-material/Person";
import InfoIcon from "@mui/icons-material/Info";
import BarChartIcon from "@mui/icons-material/BarChart";
import MenuBookIcon from "@mui/icons-material/MenuBook";

// Keyframes para la animación de fondo
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || "Invitado/a";
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [error, setError] = useState("");

  const isRegistered = !!localStorage.getItem("username");

  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8003";
  const apiKey = process.env.REACT_APP_LLM_API_KEY;

  const colors = {
    federalBlue: "#03045eff",
    honoluluBlue: "#0077b6ff",
    pacificCyan: "#00b4d8ff",
    nonPhotoBlue: "#90e0efff",
    lightCyan: "#caf0f8ff",
    lightRed: "#ff7f7f",  // Rojo clarito para "Consultar Preguntas"
    darkBlue: "#006094", // Azul más oscuro para "Empezar a Jugar"
  };

  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      const defaultMsg = `¡Hola ${username}! Bienvenido/a a WIQ Arquitectura del Software. Esperamos que disfrutes aprendiendo y jugando con nosotros.`;

      if (!apiKey) {
        console.warn("LLM API Key not found. Skipping dynamic welcome message fetch.");
        setWelcomeMessage(defaultMsg);
        return;
      }
      try {
        const currentTime = new Date();
        const question = `Generate a short, nice, and polite greeting message (2-3 sentences max) for a student named ${username} accessing the WIQ Software Architecture quiz game at the University of Oviedo. Current time is ${currentTime.toLocaleTimeString()}. Respond in Spanish.`;

        const response = await axios.post(`${apiEndpoint}/ask`, {
          question,
          apiKey,
        });
        setWelcomeMessage(response.data.answer);
      } catch (error) {
        console.error("Error fetching welcome message:", error);
        setError("Fallo al cargar el mensaje de bienvenida dinámico.");
        setWelcomeMessage(defaultMsg);
      }
    };
    fetchWelcomeMessage();
  }, [username, apiEndpoint, apiKey]);

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background: `linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)`,
        backgroundSize: "200% 200%",
        animation: `${gradientAnimation} 15s ease infinite`,
        color: colors.federalBlue,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "center",
          alignItems: "center",
          gap: { xs: 4, md: 6 },
          maxWidth: "1200px",
          width: "100%",
          p: { xs: 1, md: 2 },
        }}
      >
        <Box
          sx={{
            width: { xs: "80%", sm: "60%", md: "50%" },
            maxWidth: { xs: "350px", sm: "450px", md: "550px" },
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            component="img"
            src="/WichatAmigos.png"
            alt="Ilustración del juego WIQ"
            sx={{
              width: "100%",
              height: "auto",
              maxHeight: "550px",
              borderRadius: "16px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
              objectFit: "contain",
              transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.03)",
                boxShadow: "0 12px 25px rgba(0,0,0,0.3)",
              },
            }}
          />
        </Box>

        <Box
          sx={{
            width: { xs: "90%", md: "50%" },
            maxWidth: { xs: "500px", md: "500px" },
            minHeight: { xs: "auto", md: 500 },
            p: { xs: 2, md: 3 },
            display: "flex",
            flexDirection: "column",
            justifyContent: { xs: "center", md: "space-between" },
            alignItems: "center",
            textAlign: "center",
            color: colors.federalBlue,
            position: "relative",
          }}
        >
          <Box sx={{ width: "100%", mb: { xs: 4, md: 0 } }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: "bold",
                mb: 3,
                color: "inherit",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              👋 ¡Bienvenido/a!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "1rem", md: "1.15rem" },
                textAlign: "center",
                overflowY: "auto",
                maxHeight: { xs: "200px", md: "300px" },
                lineHeight: 1.6,
                mb: 4,
                px: { xs: 1, md: 2 },
                color: "inherit",
              }}
            >
              {welcomeMessage || "Cargando mensaje..."}
            </Typography>
          </Box>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              alignItems: "center",
              mt: "auto",
            }}
          >
            {isRegistered ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<BarChartIcon />}
                onClick={() => navigate("/statistics")}
                sx={{
                  width: "100%",
                  maxWidth: "300px",
                  height: "56px",
                  fontSize: "1.1rem",
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: "bold",
                  textTransform: "none",
                  bgcolor: "#512da8",
                  color: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "#5e35b1",
                    transform: "translateY(-2px)",
                    boxShadow: "0px 6px 15px rgba(0,0,0,0.3)",
                  },
                  "&:active": { transform: "scale(0.98)" },
                }}
              >
                Ver Estadísticas
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<PersonIcon />}
                onClick={() => navigate("/login")}
                sx={{
                  width: "100%",
                  maxWidth: "300px",
                  height: "56px",
                  fontSize: "1.1rem",
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: "bold",
                  textTransform: "none",
                  bgcolor: "#2e7d32",
                  color: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "#388e3c",
                    transform: "translateY(-2px)",
                    boxShadow: "0px 6px 15px rgba(0,0,0,0.3)",
                  },
                  "&:active": { transform: "scale(0.98)" },
                }}
              >
                Regístrate Gratis
              </Button>
            )}

            <Button
              variant="contained"
              size="large"
              startIcon={<InfoIcon />}
              onClick={() => navigate("/how-to-play")}
              sx={{
                width: "100%",
                maxWidth: "300px",
                height: "56px",
                fontSize: "1.1rem",
                fontFamily: "Poppins, sans-serif",
                fontWeight: "bold",
                textTransform: "none",
                bgcolor: "#f57c00",
                color: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: "#ef6c00",
                  transform: "translateY(-2px)",
                  boxShadow: "0px 6px 15px rgba(0,0,0,0.3)",
                },
                "&:active": { transform: "scale(0.98)" },
              }}
            >
              ¿Cómo Jugar?
            </Button>

            <Button
  variant="contained"
  size="large"
  startIcon={<MenuBookIcon />}
  onClick={() => navigate("/questions")}
  sx={{
    width: "100%",
    maxWidth: "300px",
    height: "56px",
    fontSize: "1.1rem",
    fontFamily: "Poppins, sans-serif",
    fontWeight: "bold",
    textTransform: "none",
    bgcolor: "#d32f2f", // Rojo oscuro
    color: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)", 
      boxShadow: "0px 6px 15px rgba(0,0,0,0.3)", 
    },
    "&:active": { transform: "scale(0.98)" },
  }}
>
  Consultar Preguntas
</Button>

            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/game-options")}
              data-testid="play-button"
              sx={{
                width: "100%",
                maxWidth: "300px",
                height: "56px",
                fontSize: "1.1rem",
                fontFamily: "Poppins, sans-serif",
                fontWeight: "bold",
                textTransform: "none",
                bgcolor: colors.darkBlue, // Azul más oscuro
                color: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: "#0077b6", // Azul más claro al pasar el ratón
                  transform: "translateY(-2px)",
                  boxShadow: "0px 6px 15px rgba(0,0,0,0.3)",
                },
                "&:active": { transform: "scale(0.98)" },
              }}
            >
              🎮 Empezar a Jugar
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          message={error}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      )}
    </Box>
  );
};

export default Home;
