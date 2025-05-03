import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Alert, // Import Alert for error display
  List, // Import List components for answers
  ListItem,
  ListItemIcon,
  ListItemText,
  keyframes, // Import keyframes for animation
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"; // Icon for correct answer
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked"; // Icon for incorrect answers
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"; // Icon for title

// Keyframes for the background animation (consistent with other components)
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Keyframes for fade-in animation of question cards
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.98) translateY(5px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;

const AllQuestionsWindow = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true); // Ensure loading is true at the start
      setError(null); // Clear previous errors
      try {
        const response = await fetch(`http://localhost:8000/questions`);
        if (!response.ok)
          throw new Error(
            `Network response was not ok (status: ${response.status})`
          );

        const data = await response.json();
        // Ensure data is an array before setting state
        if (Array.isArray(data)) {
          setQuestions(data);
        } else {
          console.error("Fetched data is not an array:", data);
          setQuestions([]); // Set to empty array if data is not as expected
          throw new Error("Invalid data format received from server.");
        }
      } catch (err) {
        console.error("Fetch error:", err); // Log the actual error
        setError("Error fetching questions: " + err.message);
        setQuestions([]); // Clear questions on error
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Loading and Error States centered on the page
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: 2,
          background: "linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)",
        }}
      >
        <Alert severity="error" sx={{ maxWidth: "sm", width: "100%" }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Main Content
  return (
    <Box // Outermost Box for background
      sx={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)",
        backgroundSize: "200% 200%",
        animation: `${gradientAnimation} 15s ease infinite`,
        py: { xs: 3, md: 5 }, // Vertical padding
        display: "flex",
        justifyContent: "center", // Center the container
        alignItems: "flex-start", // Align container to top
      }}
    >
      <Container
        component="main"
        maxWidth="lg"
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Paper
          elevation={8}
          sx={{
            padding: { xs: 2, sm: 3, md: 4 },
            marginTop: 0, // Removed default margin top
            borderRadius: "20px", // Consistent border radius
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
              position: "relative",
            }}
          >
            <HelpOutlineIcon
              sx={{ color: "#0b2d45", fontSize: "2.5rem", mr: 1.5 }}
            />
            <Typography
              variant="h4"
              align="center"
              sx={{
                fontWeight: "bold",
                color: "#0b2d45",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Listado de Preguntas
            </Typography>
            {/* Optional Underline Effect */}
            {/* <Box sx={{ position: 'absolute', bottom: '-8px', width: '80px', height: '4px', backgroundColor: '#1e88e5', borderRadius: '2px' }}/> */}
          </Box>

          <Box
            sx={{
              maxHeight: "70vh",
              overflowY: "auto",
              paddingRight: "10px", // Space for scrollbar
              // Custom scrollbar styling (optional)
              "&::-webkit-scrollbar": { width: "8px" },
              "&::-webkit-scrollbar-track": {
                background: "rgba(0,0,0,0.05)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(30, 136, 229, 0.5)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "rgba(30, 136, 229, 0.8)",
              },
            }}
          >
            <Grid container spacing={3}>
              {" "}
              {/* Increased spacing */}
              {questions.length > 0 ? (
                questions.map((q, index) => (
                  <Grid item xs={12} key={q._id || index}
  sx={{
    animation: `${fadeIn} 0.5s ease-out forwards`,
    animationDelay: `${index * 0.05}s`,
    opacity: 0,
  }}
>
  <Paper
    elevation={2}
    sx={{
      padding: 2.5,
      borderRadius: "12px",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderLeft: "5px solid #1e88e5",
    }}
  >
    {/* Pregunta arriba */}
    <Typography
      variant="body1"
      sx={{ fontWeight: "600", color: "#1c4966", mb: 2 }}
    >
      <strong>Pregunta {index + 1}:</strong> {q.question}
    </Typography>

    {/* Respuestas e imagen en fila */}
    <Grid container spacing={2}>
      {/* Respuestas a la izquierda */}
      <Grid item xs={12} md={8}>
        <List dense sx={{ padding: 0 }}>
          <ListItem sx={{ paddingLeft: 0 }}>
            <ListItemIcon sx={{ minWidth: "30px", color: "success.main" }}>
              <CheckCircleOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={q.correctAnswer}
              primaryTypographyProps={{
                variant: "body2",
                fontWeight: "bold",
                color: "success.dark",
              }}
            />
          </ListItem>
          {q.incorrectAnswers?.map((ans, i) => (
            <ListItem key={i} sx={{ paddingLeft: 0 }}>
              <ListItemIcon
                sx={{ minWidth: "30px", color: "text.secondary" }}
              >
                <RadioButtonUncheckedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={ans}
                primaryTypographyProps={{
                  variant: "body2",
                  color: "text.secondary",
                }}
              />
            </ListItem>
          ))}
        </List>
      </Grid>

      {/* Imagen a la derecha */}
      {q.imageUrl && (
        <Grid item xs={12} md={4}>
          <Box
            component="img"
            src={q.imageUrl}
            alt={`Imagen de la pregunta ${index + 1}`}
            sx={{
              width: "100%",
              maxHeight: 200,
              objectFit: "contain",
              borderRadius: 2,
              boxShadow: 2,
            }}
          />
        </Grid>
      )}
    </Grid>
  </Paper>
</Grid>

                ))
              ) : (
                <Grid item xs={12}>
                  <Typography
                    sx={{ textAlign: "center", color: "text.secondary", mt: 4 }}
                  >
                    No se encontraron preguntas.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AllQuestionsWindow;
