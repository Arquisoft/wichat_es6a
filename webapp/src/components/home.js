import React, { useState, useEffect } from "react";
import { Box, Typography, Snackbar, Button, keyframes } from "@mui/material"; // Removed Paper import
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

// Define keyframes for the background animation (remains the same)
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || "Student";
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [error, setError] = useState("");

  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8003";
  const apiKey = process.env.REACT_APP_LLM_API_KEY;

  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      if (!apiKey) {
        console.warn("LLM API Key not found. Skipping welcome message fetch.");
        setWelcomeMessage(
          `¡Hola ${username}! Bienvenido/a al curso de Arquitectura de Software. ¡Esperamos que disfrutes aprendiendo y jugando!`
        );
        return;
      }
      try {
        const question = `Please, generate a greeting message for a student called ${username} that is a student of the Software Architecture course in the University of Oviedo. Be nice and polite. Two to three sentences max. Respond in Spanish.`;
        const response = await axios.post(`${apiEndpoint}/ask`, {
          question,
          apiKey,
        });
        setWelcomeMessage(response.data.answer);
      } catch (error) {
        console.error("Error fetching message:", error);
        setError("Fallo al cargar el mensaje de bienvenida.");
        setWelcomeMessage(
          `¡Hola ${username}! Bienvenido/a al curso de Arquitectura de Software. ¡Esperamos que disfrutes aprendiendo y jugando!`
        );
      }
    };
    fetchWelcomeMessage();
  }, [username, apiEndpoint, apiKey]);

  return (
    // Main container with animated gradient background
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)",
        backgroundSize: "200% 200%",
        animation: `${gradientAnimation} 15s ease infinite`,
        color: "#1c4966", // Default text color for the page
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 4, // Padding around the central content area
      }}
    >
      {/* Flex container to hold Image and Text side-by-side */}
      <Box
        sx={{
          display: "flex",
          // Arrange items in a column on small screens, row on medium and larger
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "center", // Center items horizontally in the flex container
          alignItems: "center", // Center items vertically
          gap: { xs: 4, md: 6 }, // Space between image and text block
          maxWidth: "1200px", // Max width for the combined content
          width: "100%", // Take up available width
          p: { xs: 1, md: 2 }, // Inner padding if needed
          // Removed background/shadow - inherits from parent Box
        }}
      >
        {/* Image Section (Stays on the Left) */}
        <Box
          sx={{
            width: { xs: "80%", sm: "60%", md: "50%" }, // Adjusted responsive width
            maxWidth: { xs: "350px", sm: "450px", md: "550px" }, // Added max width for better control
            height: "auto", // Height adjusts automatically
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            component="img"
            src="/WichatAmigos.png" // Ensure path is correct
            alt="Ilustración del juego WIQ"
            sx={{
              width: "100%",
              height: "auto",
              maxHeight: "550px",
              borderRadius: "16px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
              objectFit: "contain",
              transition:
                "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.03)",
                boxShadow: "0 12px 25px rgba(0,0,0,0.4)",
              },
            }}
          />
        </Box>

        {/* Text and Button Section (Now on the Right) */}
        <Box
          sx={{
            width: { xs: "90%", md: "50%" }, // Adjusted responsive width
            maxWidth: { xs: "500px", md: "500px" }, // Consistent max width
            minHeight: { xs: "auto", md: 500 }, // Auto height on small, fixed on medium+
            p: { xs: 2, md: 3 }, // Padding inside the text box
            display: "flex",
            flexDirection: "column",
            // Justify content to push button towards bottom, but center text vertically overall
            justifyContent: { xs: "center", md: "space-between" },
            alignItems: "center", // Center items horizontally within this box
            textAlign: "center", // Center align text elements
            color: "#1c4966", // Ensure text color contrasts with gradient
            // Removed distinct background, border, shadow etc. Inherits gradient.
            position: "relative", // Keeps button positioning context if needed, but might not be necessary now
          }}
        >
          {/* Text content container */}
          <Box sx={{ width: "100%", mb: { xs: 4, md: 0 } }}>
            {" "}
            {/* Add bottom margin on mobile */}
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: "bold",
                mb: 3,
                color: "#0b2d45", // Slightly darker heading for emphasis
                fontFamily: "Poppins, sans-serif",
              }}
            >
              👋 ¡Bienvenido/a!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "1rem", md: "1.1rem" },
                textAlign: "center", // Center text now that it's not justified in a card
                overflowY: "auto",
                maxHeight: { xs: "150px", md: "250px" },
                lineHeight: 1.6,
                mb: 4, // Margin below text before button area
                px: { xs: 1, md: 2 },
                color: "#2a5a7a", // Adjusted text color for contrast
              }}
            >
              {welcomeMessage || "Cargando mensaje..."}
            </Typography>
          </Box>

          {/* Button container - ensures button is centered horizontally */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              mt: "auto",
              pt: 2,
            }}
          >
            {" "}
            {/* mt: auto pushes to bottom if space allows */}
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/game-options")}
              sx={{
                px: 5,
                py: 1.5,
                fontSize: "1.1rem",
                borderRadius: "12px",
                background: "linear-gradient(45deg, #1E90FF 30%, #00BFFF 90%)",
                color: "#fff",
                fontFamily: "Poppins, sans-serif",
                fontWeight: "bold",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
                transition:
                  "transform 0.2s ease, background 0.3s ease, box-shadow 0.2s ease",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #00BFFF 30%, #1E90FF 90%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0px 6px 15px rgba(0,0,0,0.3)",
                },
              }}
            >
              🎮 Empezar a Jugar
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error Message Snackbar (remains the same) */}
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
