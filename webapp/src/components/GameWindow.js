// src/components/GameWindow.js

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  keyframes,
} from "@mui/material"; // Added keyframes
import { Whatshot as WhatshotIcon } from "@mui/icons-material";
import ChatClues from "./ChatClues";
import Game from "./Game";
import axios from "axios";
import QuestionTimer from "./QuestionTimer";

// Keyframes for the background animation (consistent with other components)
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// --- Valores por defecto ---
const defaultDifficulty = {
  name: "Medio",
  questionCount: 5,
  timePerQuestion: 30,
};
const defaultCategory = { name: "Variado", endpoint: "/variado" };

// --- Componente Principal ---
export function GameWindow() {
  const navigate = useNavigate();
  const location = useLocation();

  const { category = defaultCategory, difficulty = defaultDifficulty } =
    location.state || {};

  // --- Referencias y Estado ---
  const gameRef = useRef(new Game(navigate));
  const [currentQuestion, setCurrentQuestion] = useState(null); // Objeto Question actual
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedbackColors, setFeedbackColors] = useState([]);
  const [hasUsedFiftyFifty, setHasUsedFiftyFifty] = useState(false);
  const [hasUsedAskAI, setHasUsedAskAI] = useState(false);
  const [hasUsedHint, setHasUsedHint] = useState(false);
  const [questionImage, setQuestionImage] = useState(null);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const chatCluesRef = useRef(null);
  const [isImageActuallyLoading, setIsImageActuallyLoading] = useState(false);

  // --- Configuración de Endpoints y API Key ---
  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8003";
  const apiKey =
    process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY; // Para pistas

  // --- Efecto de Inicialización del Juego ---
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initializeGame = async () => {
      setIsGameLoading(true);
      console.log(
        `[init] Initializing game with category "${category.name}" and difficulty "${difficulty.name}"...`
      );

      try {
        await gameRef.current.init(category, difficulty);
        console.log(
          `[init] Game instance initialized. ${gameRef.current.questions.length} questions loaded.`
        );
        const firstQuestion = gameRef.current.getCurrentQuestion();
        if (firstQuestion) {
          console.log("[init] Setting first question.");
          setCurrentQuestion(firstQuestion);
          setPoints(gameRef.current.getCurrentPoints());
          setStreak(gameRef.current.getCurrentStreak());
          setFeedbackColors([]);
          setSelectedAnswer(null);
          setHasUsedFiftyFifty(false);
          setHasUsedAskAI(false);
          setHasUsedHint(false);
        } else {
          console.error(
            "[init] No questions available after initialization! Ending game."
          );
          gameRef.current.endGame();
        }
      } catch (error) {
        console.error(
          "[init] Critical error during game initialization:",
          error.response?.data || error.message || error
        );
        try {
          await gameRef.current.TestingInit(difficulty.questionCount);
          const firstQuestion = gameRef.current.getCurrentQuestion();
          if (firstQuestion) setCurrentQuestion(firstQuestion);
          else gameRef.current.endGame();
        } catch (fallbackError) {
          console.error(
            "[init] Error during fallback TestingInit:",
            fallbackError
          );
          // Maybe navigate to an error page or show a persistent error message
          gameRef.current.endGame(); // End game if fallback also fails
        }
      } finally {
        setIsGameLoading(false);
        console.log("[init] Initialization complete.");
      }
    };

    initializeGame();
  }, [category, difficulty, navigate, apiKey]); // Dependencies remain the same

  // --- Efecto para Actualizar la Imagen Mostrada ---
  useEffect(() => {
    const game = gameRef.current;

    if (currentQuestion) {
      const imageUrl = currentQuestion.imageUrl;
      const nextIndex = game.questionIndex + 1;

      // Pre-carga
      if (nextIndex < game.questions.length) {
        const nextImageUrl = game.questions[nextIndex].imageUrl;
        if (nextImageUrl) {
          const img = new Image();
          img.src = nextImageUrl;
        }
      }

      // Actualizar imagen actual
      setQuestionImage(imageUrl); // Always set the image URL
      setIsImageActuallyLoading(!!imageUrl); // Start loading only if there's an URL

      console.log("Datos de imagen procesados para pregunta actual:", {
        questionText: currentQuestion.questionText,
        imageUrl: imageUrl,
        nextImageToPreload:
          nextIndex < game.questions.length
            ? game.questions[nextIndex].imageUrl
            : "N/A",
      });
    } else {
      setQuestionImage(null);
      setIsImageActuallyLoading(false);
    }
  }, [currentQuestion]); // Dependency is correct

  // --- Manejador de Clic en Respuesta ---
  const handleAnswerClick = useCallback(
    (index) => {
      if (selectedAnswer !== null || !currentQuestion) return;

      const correctIndex = currentQuestion.answers.findIndex(
        (ans) => ans.isCorrect
      );
      setSelectedAnswer(index);

      const newColors = currentQuestion.answers.map((_, i) => {
        if (i === correctIndex) return "#4caf50"; // Green for correct
        if (i === index && i !== correctIndex) return "#f44336"; // Red for incorrect selected
        return "#9e9e9e"; // Grey for others once answer is selected
      });
      setFeedbackColors(newColors);

      setTimeout(() => {
        gameRef.current.answerQuestion(index);
        const nextQ = gameRef.current.getCurrentQuestion();
        setCurrentQuestion(nextQ);
        setPoints(gameRef.current.getCurrentPoints());
        setStreak(gameRef.current.getCurrentStreak());
        if (chatCluesRef.current?.disableChat) {
          chatCluesRef.current.disableChat();
        }
        setSelectedAnswer(null);
        setFeedbackColors([]);
        setHasUsedFiftyFifty(false); // Reset 50/50 availability for next question
        setHasUsedAskAI(false); // Reset Ask AI availability
        setHasUsedHint(false); // Reset Hint availability
        console.log("[handleAnswerClick Timeout] Game state update complete.");
      }, 1500);
    },
    [currentQuestion, selectedAnswer] // Dependencies seem correct
  );

  // --- Manejador para Obtener Pista ---
  const handleGetHint = useCallback(async () => {
    if (!currentQuestion || !chatCluesRef.current || hasUsedHint) return;

    chatCluesRef.current.addMessage("IA: Solicitando pista...");
    setHasUsedHint(true); // Mark as used immediately
    gameRef.current.useHint(); // Update game logic state

    try {
      const response = await axios.post(`${apiEndpoint}/getHint`, {
        question: currentQuestion.questionText,
        answers: currentQuestion.answers.map((a) => ({ text: a.text })),
        apiKey: apiKey,
      });
      const hintMessage = `IA: ${response.data.hint}`;
      if (chatCluesRef.current) chatCluesRef.current.addMessage(hintMessage);
    } catch (error) {
      let errorMessage = "IA: Error al obtener la pista.";
      if (error.response)
        errorMessage = `IA: Error del servidor (${error.response.status}) al pedir pista.`;
      else if (error.request)
        errorMessage = "IA: Sin respuesta del servidor al pedir pista.";
      chatCluesRef.current.addMessage(errorMessage);
      console.error("Hint error:", error.response?.data || error.message);
      // Optionally allow retry by setting hasUsedHint back to false?
      // setHasUsedHint(false);
    }
  }, [currentQuestion, apiEndpoint, apiKey, hasUsedHint]); // Added hasUsedHint dependency

  // --- Manejador para Comodín 50/50 ---
  const handleFiftyFifty = () => {
    if (!currentQuestion || selectedAnswer !== null || hasUsedFiftyFifty)
      return;

    setHasUsedFiftyFifty(true); // Mark as used
    gameRef.current.useFiftyFifty(); // Update game logic state

    const correctIndex = currentQuestion.answers.findIndex(
      (ans) => ans.isCorrect
    );
    const incorrectIndices = currentQuestion.answers
      .map((ans, idx) => (ans.isCorrect ? -1 : idx))
      .filter((idx) => idx !== -1);

    const toRemove = incorrectIndices
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    const newColors = currentQuestion.answers.map((_, i) => {
      if (toRemove.includes(i)) return "#757575"; // Grey for disabled
      return null;
    });

    setFeedbackColors(newColors);
  };

  // --- Manejador para Preguntar a IA ---
  const handleAskAI = () => {
    if (!currentQuestion || selectedAnswer !== null || hasUsedAskAI) return;

    if (chatCluesRef.current) {
      setHasUsedAskAI(true); // Mark as used
      gameRef.current.useAskAI(); // Update game logic state
      chatCluesRef.current.enableChat(); // Enable chat input in ChatClues component
    }
  };

  // Estado de Carga Inicial
  if (isGameLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          // Apply consistent animated background
          background: "linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)",
          backgroundSize: "200% 200%",
          animation: `${gradientAnimation} 15s ease infinite`,
        }}
      >
        <CircularProgress color="primary" size={60} />
        <Typography
          color="#0b2d45"
          sx={{ mt: 2, fontStyle: "italic", fontWeight: "500" }}
        >
          Cargando preguntas...
        </Typography>
      </Box>
    );
  }

  // Renderizado Principal del Juego
  return (
    <Box
      sx={{
        // Apply consistent animated background
        background: "linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)",
        backgroundSize: "200% 200%",
        animation: `${gradientAnimation} 15s ease infinite`,
        minHeight: "100vh",
        p: { xs: 1, sm: 2, md: 3 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 hidden>{currentQuestion?.questionText || "Cargando..."}</h1>
      <Box
        sx={{
          width: "100%",
          maxWidth: 1200,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {" "}
        {/* Added flex properties */}
        {/* Cabecera: Número de Pregunta */}
        <Typography
          variant="h4" // Slightly larger heading
          align="center"
          fontWeight="bold"
          color="#0b2d45" // Dark blue consistent color
          fontFamily="Poppins, sans-serif" // Consistent font
          sx={{ mb: { xs: 2, md: 3 }, mt: { xs: 2, md: 3 } }}
        >
          Pregunta {currentQuestion ? gameRef.current.questionIndex + 1 : "-"} /{" "}
          {gameRef.current.questions.length || "-"}
        </Typography>
        {/* Grid Principal */}
        <Grid
          container
          justifyContent="center"
          spacing={{ xs: 2, md: 4 }}
          alignItems="stretch" // Ensure columns stretch to equal height
          sx={{ flexGrow: 1 }} // Allow grid to grow
        >
          {/* Columna Izquierda: Chat/Pistas */}
          <Grid
            item
            xs={12}
            sm={6}
            md={3}
            sx={{
              display: { xs: "none", sm: "flex" }, // Hidden on extra small
              flexDirection: "column",
            }}
          >
            {/* Apply consistent card styling */}
            <Box
              component={Paper} // Use Paper for card effect
              elevation={4}
              sx={{
                flexGrow: 1,
                bgcolor: "rgba(255, 255, 255, 0.85)", // Semi-transparent white
                backdropFilter: "blur(8px)",
                borderRadius: "16px", // Consistent radius
                p: 1.5, // Inner padding
                display: "flex",
                flexDirection: "column", // Ensure ChatClues fills height
                minHeight: { sm: 300, md: 350 }, // Adjusted min height
              }}
            >
              <ChatClues
                ref={chatCluesRef}
                actualQuestion={currentQuestion?.questionText || ""}
                answers={currentQuestion?.answers || []}
              />
            </Box>
          </Grid>

          {/* Columna Central: Imagen */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
            {" "}
            {/* Ensure flex for centering */}
            <Box
              sx={{
                width: "100%",
                aspectRatio: "1 / 1", // Maintain square aspect ratio
                // height: 0, // Kept for reference, aspectRatio is preferred
                // paddingBottom: { xs: "75%", sm: "100%" }, // Replaced by aspectRatio
                position: "relative",
                borderRadius: "20px", // Consistent radius
                boxShadow: "0 8px 20px rgba(0,0,0,0.25)", // Consistent shadow
                overflow: "hidden",
                bgcolor: "rgba(255, 255, 255, 0.3)", // Lighter placeholder background
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isImageActuallyLoading && questionImage && (
                <CircularProgress
                  size={40}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-20px",
                    marginLeft: "-20px",
                    color: "primary.main", // Use primary color
                    zIndex: 1,
                  }}
                />
              )}
              <Box
                component="img"
                key={
                  questionImage ||
                  `default-${
                    currentQuestion?.id || gameRef.current.questionIndex
                  }`
                } // More robust key
                src={questionImage || "/WichatAmigos.png"} // Default image path
                alt={`Imagen para: ${
                  currentQuestion?.questionText || "Cargando..."
                }`}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover", // Cover maintains aspect ratio while filling
                  display: "block",
                  opacity: isImageActuallyLoading ? 0 : 1, // Fade in image
                  transition: "opacity 0.5s ease-in-out", // Smoother fade
                }}
                onLoad={() => setIsImageActuallyLoading(false)}
                onError={(e) => {
                  setIsImageActuallyLoading(false);
                  console.warn(
                    `Error loading image: ${e.target.src}. Using default.`
                  );
                  e.target.onerror = null; // Prevent infinite loop if default also fails
                  e.target.src = "/WichatAmigos.png";
                }}
              />
            </Box>
          </Grid>

          {/* Columna Derecha: Timer y Botones Comodín */}
          <Grid
            item
            xs={12}
            md={3}
            sx={{ display: "flex", flexDirection: "column" }}
          >
            {" "}
            {/* Centering column content */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-around", // Distribute space
                flexGrow: 1, // Take available space
                gap: 2, // Space between elements
                mt: { xs: 3, md: 0 }, // Margin top on small screens
                p: 2,
                bgcolor: "rgba(255, 255, 255, 0.85)", // Consistent card bg
                backdropFilter: "blur(8px)",
                borderRadius: "16px", // Consistent radius
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                minHeight: { md: 350 }, // Match chat clues height approx
              }}
            >
              <QuestionTimer
                keyProp={`timer-${
                  currentQuestion?.id || gameRef.current.questionIndex
                }`}
                duration={difficulty.timePerQuestion || 30}
                pauseTimer={selectedAnswer !== null}
                onComplete={() => {
                  /* ... onComplete logic ... */ if (selectedAnswer !== null)
                    return;
                  console.log("[onComplete Timer] Time's up!");
                  const correctIndex =
                    currentQuestion?.answers.findIndex(
                      (ans) => ans.isCorrect
                    ) ?? -1;
                  const newColors =
                    currentQuestion?.answers.map((_, i) =>
                      i === correctIndex ? "#4caf50" : "#f44336"
                    ) || [];
                  setFeedbackColors(newColors);
                  setTimeout(() => {
                    gameRef.current.answerQuestion(-1, true);
                    const nextQ = gameRef.current.getCurrentQuestion();
                    setCurrentQuestion(nextQ);
                    setPoints(gameRef.current.getCurrentPoints());
                    setStreak(gameRef.current.getCurrentStreak());
                    setSelectedAnswer(null);
                    setFeedbackColors([]);
                    setHasUsedFiftyFifty(false);
                    setHasUsedAskAI(false);
                    setHasUsedHint(false);
                  }, 1500);
                  return { shouldRepeat: false };
                }}
              />
              {/* Styling Hint/AI/50-50 Buttons */}
              <Button
                variant="contained"
                onClick={handleGetHint}
                disabled={
                  selectedAnswer !== null || hasUsedHint || !currentQuestion
                }
                sx={{
                  borderRadius: "12px",
                  width: "80%",
                  bgcolor: "#ffb74d",
                  "&:hover": { bgcolor: "#ffa726" },
                  "&:disabled": { bgcolor: "#bdbdbd" },
                }}
              >
                Pista
              </Button>
              <Button
                variant="contained"
                onClick={handleAskAI}
                disabled={
                  selectedAnswer !== null || hasUsedAskAI || !currentQuestion
                }
                sx={{
                  borderRadius: "12px",
                  width: "80%",
                  bgcolor: "#4db6ac",
                  "&:hover": { bgcolor: "#26a69a" },
                  "&:disabled": { bgcolor: "#bdbdbd" },
                }}
              >
                Pregunta IA
              </Button>
              <Button
                variant="contained"
                onClick={handleFiftyFifty}
                disabled={
                  selectedAnswer !== null ||
                  hasUsedFiftyFifty ||
                  !currentQuestion
                }
                sx={{
                  borderRadius: "12px",
                  width: "80%",
                  bgcolor: "#f06292",
                  "&:hover": { bgcolor: "#ec407a" },
                  "&:disabled": { bgcolor: "#bdbdbd" },
                }}
              >
                50 / 50
              </Button>
            </Box>
          </Grid>

          {/* Grid item for ChatClues on smaller screens (below image) */}
          <Grid
            item
            xs={12}
            sm={6} // Takes half width below image on small screens
            sx={{
              display: { xs: "flex", sm: "none" }, // Visible only on extra small
              flexDirection: "column",
              order: 4, // Ensure it appears after other main elements
              mt: 2, // Margin top
            }}
          >
            <Box
              component={Paper}
              elevation={4}
              sx={{
                flexGrow: 1,
                bgcolor: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(8px)",
                borderRadius: "16px",
                p: 1.5,
                display: "flex",
                minHeight: 200, // Min height for chat on mobile
              }}
            >
              <ChatClues
                ref={chatCluesRef}
                actualQuestion={currentQuestion?.questionText || ""}
                answers={currentQuestion?.answers || []}
              />
            </Box>
          </Grid>
        </Grid>
        {/* Sección Inferior: Texto Pregunta y Botones Respuesta */}
        <Box
          sx={{
            mt: { xs: 3, md: 4 }, // Adjusted margin top
            mx: "auto",
            maxWidth: { xs: "95%", sm: 800 }, // Slightly wider max width
            width: "100%",
          }}
        >
          {/* Question Text Area */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              minHeight: "3.5em", // Increased min height
              // Removed borderBottom, using Paper bg now
              p: 2, // Add padding
              bgcolor: "rgba(255, 255, 255, 0.6)", // Subtle background for question text
              borderRadius: "12px", // Rounded corners
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)", // Inner shadow
            }}
          >
            <Typography
              variant="h6"
              color="#0b2d45" // Dark blue text
              sx={{
                textAlign: "left",
                flexGrow: 1,
                mr: 2,
                fontWeight: "500",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {currentQuestion?.questionText || "Cargando pregunta..."}
            </Typography>
            {/* Points and Streak */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                bgcolor: "rgba(0, 0, 0, 0.1)",
                p: "4px 10px",
                borderRadius: "16px",
              }}
            >
              <Typography
                variant="h6"
                color="#1e88e5"
                sx={{ mr: 1, fontWeight: "bold" }}
              >
                Pts: {points}
              </Typography>
              <WhatshotIcon sx={{ color: "#f44336", mr: 0.5 }} />
              <Typography
                variant="h6"
                sx={{ color: "#f44336", fontWeight: "bold" }}
              >
                {streak}
              </Typography>
            </Box>
          </Box>

          {/* Answer Buttons */}
          <Grid container spacing={2} mt={1}>
            {currentQuestion?.answers.map((answer, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                key={`${
                  currentQuestion.id || gameRef.current.questionIndex
                }-${index}`}
              >
                {" "}
                {/* Improved Key */}
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    minHeight: "3.8em", // Slightly taller buttons
                    borderRadius: "12px", // Consistent radius
                    p: 1.5,
                    fontSize: "1rem",
                    fontWeight: "500", // Slightly bolder text
                    fontFamily: "Poppins, sans-serif",
                    textTransform: "none", // Prevent uppercase
                    bgcolor:
                      feedbackColors[index] || // Use feedback color directly if available
                      (selectedAnswer !== null
                        ? "#9e9e9e" // Grey out if *any* answer selected & this isn't the feedback one
                        : "linear-gradient(45deg, #1E90FF 30%, #00BFFF 90%)"), // Default: Gradient
                    color: "white",
                    border:
                      selectedAnswer === index ? "3px solid #FFF" : "none", // White border if selected
                    boxShadow:
                      selectedAnswer !== null
                        ? "none"
                        : "0 3px 5px rgba(0,0,0,0.2)", // Shadow only if active
                    transition:
                      "background 0.3s ease-out, border 0.2s, transform 0.15s ease-out, box-shadow 0.2s",
                    "&:hover": {
                      bgcolor:
                        feedbackColors[index] || // Keep feedback color on hover
                        (selectedAnswer !== null
                          ? "#9e9e9e" // Keep greyed out
                          : "linear-gradient(45deg, #00BFFF 30%, #1E90FF 90%)"), // Default hover: Inverted Gradient
                      transform:
                        selectedAnswer === null &&
                        !feedbackColors[index]?.startsWith("#75")
                          ? "scale(1.02)"
                          : "none", // Scale up only if active
                      boxShadow:
                        selectedAnswer === null
                          ? "0 5px 8px rgba(0,0,0,0.3)"
                          : "none", // Increase shadow only if active
                    },
                    "&:active": {
                      transform:
                        selectedAnswer === null &&
                        !feedbackColors[index]?.startsWith("#75")
                          ? "scale(0.98)"
                          : "none", // Scale down only if active
                    },
                    // Styles for disabled state (includes 50/50 greyed out)
                    "&:disabled": {
                      background: feedbackColors[index] || "#9e9e9e", // Use feedback color (e.g., #757575 for 50/50) or default grey
                      color:
                        feedbackColors[index] === "#757575"
                          ? "rgba(255, 255, 255, 0.5)"
                          : "rgba(255, 255, 255, 0.7)", // Dim text
                      opacity: feedbackColors[index] === "#757575" ? 0.6 : 1, // Fade 50/50 buttons more
                      cursor: "default",
                      transform: "none",
                      boxShadow: "none",
                      border:
                        selectedAnswer === index
                          ? "3px solid rgba(255,255,255,0.5)"
                          : "none", // Dim border if selected
                    },
                  }}
                  onClick={() => handleAnswerClick(index)}
                  disabled={
                    selectedAnswer !== null ||
                    feedbackColors[index] === "#757575"
                  } // Disable if any answer selected OR if greyed out by 50/50
                >
                  {answer.text}
                </Button>
              </Grid>
            ))}
            {/* Message when game ends */}
            {!currentQuestion && !isGameLoading && (
              <Grid item xs={12}>
                <Typography
                  color="#0b2d45"
                  align="center"
                  sx={{ mt: 4, fontWeight: "500" }}
                >
                  {gameRef.current.questionIndex >=
                  gameRef.current.questions.length
                    ? "Fin de la partida. Calculando resultados..."
                    : "No hay preguntas disponibles."}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}

export default GameWindow;
