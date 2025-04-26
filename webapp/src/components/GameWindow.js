// src/components/GameWindow.js

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import { Typography, Button, Box, CircularProgress } from "@mui/material";
import { Whatshot as WhatshotIcon } from "@mui/icons-material";
import ChatClues from "./ChatClues";
import Game from "./Game";
import axios from "axios";
import QuestionTimer from "./QuestionTimer";

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
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
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
        // Inicializar la instancia de Game (obtiene preguntas Y imageUrls del llm-service)
        await gameRef.current.init(category, difficulty);
        console.log(
          `[init] Game instance initialized. ${gameRef.current.questions.length} questions loaded.`
        );

        // Establecer la primera pregunta en el estado del componente
        const firstQuestion = gameRef.current.getCurrentQuestion();
        if (firstQuestion) {
          console.log("[init] Setting first question.");
          setCurrentQuestion(firstQuestion);
          setPoints(gameRef.current.getCurrentPoints());
          setStreak(gameRef.current.getCurrentStreak());
          setFeedbackColors([]);
          setSelectedAnswer(null);
          setHasUsedFiftyFifty(false);
          // La imagen se actualizará en el siguiente efecto
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
          // Intenta cargar preguntas de prueba como fallback
          await gameRef.current.TestingInit(difficulty.questionCount);
          const firstQuestion = gameRef.current.getCurrentQuestion();
          if (firstQuestion) setCurrentQuestion(firstQuestion);
          else gameRef.current.endGame();
        } catch (fallbackError) {
          console.error(
            "[init] Error during fallback TestingInit:",
            fallbackError
          );
        }
      } finally {
        setIsGameLoading(false);
        console.log("[init] Initialization complete.");
      }
    };

    initializeGame();
  }, [category, difficulty, navigate, apiKey]);

  // --- Efecto para Actualizar la Imagen Mostrada ---
  useEffect(() => {
    const game = gameRef.current; // Acceso a la instancia de Game

    if (currentQuestion) {
      const imageUrl = currentQuestion.imageUrl;

      // --- Pre-carga de la siguiente imagen ---
      const nextIndex = game.questionIndex + 1;
      if (nextIndex < game.questions.length) {
        const nextImageUrl = game.questions[nextIndex].imageUrl;
        if (nextImageUrl) {
          // console.log("Prefetching image:", nextImageUrl);
          const img = new Image();
          img.src = nextImageUrl; // Inicia descarga en segundo plano (caché del navegador)
        }
      }
      // --------------------------------------

      // --- Actualizar imagen actual y estado de carga ---
      if (imageUrl) {
        setIsImageActuallyLoading(true); // Indicar que vamos a empezar a cargar
      } else {
        setIsImageActuallyLoading(false); // No hay URL, no hay carga
      }
      setQuestionImage(imageUrl); // Actualizar la URL para el <img>
      // --------------------------------------------

      console.log("Datos de imagen procesados para pregunta actual:", {
        questionText: currentQuestion.questionText,
        imageUrl: imageUrl,
        nextImageToPreload:
          nextIndex < game.questions.length
            ? game.questions[nextIndex].imageUrl
            : "N/A",
      });
    } else {
      setQuestionImage(null); // No hay pregunta actual
      setIsImageActuallyLoading(false); // No hay carga
    }
  }, [currentQuestion]);

  // --- Manejador de Clic en Respuesta ---
  const handleAnswerClick = useCallback(
    (index) => {
      if (selectedAnswer !== null || !currentQuestion) return;
      // console.log(`[handleAnswerClick] Answer ${index} clicked.`);

      const correctIndex = currentQuestion.answers.findIndex(
        (ans) => ans.isCorrect
      );
      setSelectedAnswer(index);

      const newColors = currentQuestion.answers.map((_, i) => {
        if (i === correctIndex) return "#a5d6a7"; // Verde claro
        if (i === index && i !== correctIndex) return "#ef9a9a"; // Rojo claro
        return null;
      });
      setFeedbackColors(newColors);

      setTimeout(() => {
        gameRef.current.answerQuestion(index); // Actualizar estado lógico

        const nextQ = gameRef.current.getCurrentQuestion();
        setCurrentQuestion(nextQ); // Actualizar pregunta en UI

        setPoints(gameRef.current.getCurrentPoints());
        setStreak(gameRef.current.getCurrentStreak());
        if (chatCluesRef.current?.disableChat) {
          chatCluesRef.current.disableChat();
        }
        setSelectedAnswer(null);
        setFeedbackColors([]);
        console.log("[handleAnswerClick Timeout] Game state update complete.");

      }, 1500); // 1.5 segundos

    },
    [currentQuestion, selectedAnswer]
  );

  // --- Manejador para Obtener Pista ---
  const handleGetHint = useCallback(async () => {
    if (!currentQuestion || !chatCluesRef.current) return;

    chatCluesRef.current.addMessage("IA: Solicitando pista...");

    try {
      const response = await axios.post(`${apiEndpoint}/getHint`, {
        question: currentQuestion.questionText,
        answers: currentQuestion.answers.map((a) => ({ text: a.text })),
        apiKey: apiKey,
      });
      const hintMessage = `IA: ${response.data.hint}`;
      if (chatCluesRef.current) chatCluesRef.current.addMessage(hintMessage);
      gameRef.current.useHint();
      setHasUsedHint(true);


    } catch (error) {
      let errorMessage = "IA: Error al obtener la pista.";
      if (error.response)
        errorMessage = `IA: Error del servidor (${error.response.status}) al pedir pista.`;
      else if (error.request)
        errorMessage = "IA: Sin respuesta del servidor al pedir pista.";
      chatCluesRef.current.addMessage(errorMessage);
      console.error("Hint error:", error.response?.data || error.message);
    }
  }, [currentQuestion, apiEndpoint, apiKey]);

  // --- Manejador para Comodín 50/50 ---
  const handleFiftyFifty = () => {
    if (!currentQuestion || selectedAnswer !== null || hasUsedFiftyFifty)
      return;

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
      if (toRemove.includes(i)) return "#757575"; // Gris oscuro para deshabilitado
      return null;
    });

    setFeedbackColors(newColors);
    setHasUsedFiftyFifty(true);
    gameRef.current.useFiftyFifty(); // Informar a la clase Game (para puntuación)
  };
  
  const handleAskAI = () => {
    if (chatCluesRef.current) {
      chatCluesRef.current.enableChat();
      gameRef.current.useAskAI();
      setHasUsedAskAI(true);
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
          bgcolor: "#121212",
        }}
      >
        <CircularProgress color="primary" size={60} />
        <Typography color="white" sx={{ mt: 2, fontStyle: "italic" }}>
          Cargando preguntas...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#121212",
        minHeight: "100vh",
        p: { xs: 1, sm: 2, md: 3 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 hidden>{currentQuestion?.questionText || "Cargando..."}</h1>
      <Box sx={{ width: "100%", maxWidth: 1200 }}>
        {/* Cabecera: Número de Pregunta */}
        <Typography
          variant="h5"
          align="center"
          fontWeight="bold"
          color="white"
          sx={{ mb: { xs: 3, md: 5 }, mt: 3 }}
        >
          Pregunta {currentQuestion ? gameRef.current.questionIndex + 1 : "-"} /{" "}
          {gameRef.current.questions.length || "-"}
        </Typography>
        {/* Grid Principal */}
        <Grid
          container
          justifyContent="center"
          spacing={{ xs: 2, md: 4 }}
          alignItems="stretch"
        >
          {/* Columna Izquierda: Chat/Pistas */}
          <Grid
            item
            xs={12}
            sm={6}
            md={3}
            sx={{
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                bgcolor: "#222",
                borderRadius: 2,
                p: 1,
                display: "flex",
                minHeight: { sm: 250, md: 300 },
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
          <Grid item xs={12} sm={6} md={4}>
            <Box
              sx={{
                width: "100%",
                height: 0,
                paddingBottom: { xs: "75%", sm: "100%" },
                position: "relative",
                borderRadius: 4,
                boxShadow: 6,
                overflow: "hidden",
                bgcolor: "#333",
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
                    color: "primary.light",
                    zIndex: 1,
                  }}
                />
              )}
              <Box
                component="img"
                key={questionImage || `default-${currentQuestion?.questionText || "no-question"}`}
                src={questionImage || "/WichatAmigos.png"}
                alt={`Imagen para: ${currentQuestion?.questionText || "Cargando..."}`}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  opacity: isImageActuallyLoading ? 0 : 1,
                  transition: "opacity 0.3s ease-in-out",
                }}
                onLoad={() => setIsImageActuallyLoading(false)}
                onError={(e) => {
                  setIsImageActuallyLoading(false);
                  console.warn(`Error loading image: ${e.target.src}. Using default.`);
                  e.target.onerror = null;
                  e.target.src = "/WichatAmigos.png";
                }}
              />
            </Box>
          </Grid>
  
          {/* Columna Derecha: Timer y Botón Hint */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: { xs: "auto", sm: 300, md: 300 },
                gap: 3,
                mt: { xs: 2, sm: 0 },
              }}
            >
              <QuestionTimer
                keyProp={`timer-${currentQuestion?.id || gameRef.current.questionIndex}`}
                duration={difficulty.timePerQuestion || 30}
                pauseTimer={selectedAnswer !== null}
                onComplete={() => {
                  if (selectedAnswer !== null) return;
                  console.log("[onComplete Timer] Time's up!");
                  const correctIndex =
                    currentQuestion?.answers.findIndex((ans) => ans.isCorrect) ?? -1;
                  const newColors =
                    currentQuestion?.answers.map((_, i) =>
                      i === correctIndex ? "#a5d6a7" : "#ef9a9a"
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
                  }, 1500);
                  return { shouldRepeat: false };
                }}
              />
              <Button
                variant="contained"
                color="secondary"
                onClick={handleGetHint}
                disabled={selectedAnswer !== null || hasUsedHint || !currentQuestion}
              >
                Pista
              </Button>
              <Button
                variant="contained"
                onClick={handleAskAI}
                disabled={selectedAnswer !== null || hasUsedAskAI || !currentQuestion}
                sx={{
                  mt: 1,
                  bgcolor: "#4db6ac",
                  color: "#fff",
                  "&:hover": { bgcolor: "#00897b" },
                  "&:disabled": { bgcolor: "#888", color: "#eee" },
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
                  bgcolor: "#f06292",
                  color: "#fff",
                  "&:hover": { bgcolor: "#ec407a" },
                  "&:disabled": { bgcolor: "#bdbdbd", color: "#757575" },
                }}
              >
                50 / 50
              </Button>
            </Box>
          </Grid>
        </Grid>
  
        {/* Sección Inferior: Texto Pregunta y Botones Respuesta */}
        <Box
          sx={{
            mt: { xs: 3, md: 5 },
            mx: "auto",
            maxWidth: { xs: "95%", sm: 700 },
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              minHeight: "3em",
              borderBottom: "1px solid #444",
              pb: 1,
            }}
          >
            <Typography
              variant="h6"
              color="white"
              sx={{ textAlign: "left", flexGrow: 1, mr: 2, fontWeight: "500" }}
            >
              {currentQuestion?.questionText || "Cargando pregunta..."}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <Typography variant="h6" color="#90caf9" sx={{ mr: 1 }}>
                Pts: {points}
              </Typography>
              <WhatshotIcon color="error" sx={{ mr: 0.5 }} />
              <Typography variant="h6" color="error">
                {streak}
              </Typography>
            </Box>
          </Box>
          <Grid container spacing={2} mt={1}>
            {currentQuestion?.answers.map((answer, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                key={`${currentQuestion.questionText}-${index}`}
              >
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    minHeight: "3.5em",
                    borderRadius: 2,
                    p: 1.5,
                    fontSize: "1rem",
                    bgcolor:
                      feedbackColors[index] ||
                      (selectedAnswer !== null ? "#757575" : "#1976d2"),
                    color: "white",
                    border:
                      selectedAnswer === index ? "3px solid #FFF" : "none",
                    transition:
                      "background-color 0.3s, border 0.3s, transform 0.1s",
                    "&:hover": {
                      bgcolor:
                        feedbackColors[index] ||
                        (selectedAnswer !== null ? "#757575" : "#1565c0"),
                      transform:
                        selectedAnswer === null &&
                        !feedbackColors[index]?.startsWith("#75")
                          ? "scale(1.02)"
                          : "none",
                    },
                    "&:active": {
                      transform:
                        selectedAnswer === null &&
                        !feedbackColors[index]?.startsWith("#75")
                          ? "scale(0.98)"
                          : "none",
                    },
                    "&:disabled": {
                      bgcolor: feedbackColors[index] || "#757575",
                      color:
                        feedbackColors[index] === "#757575"
                          ? "#aaa"
                          : "rgba(255, 255, 255, 0.7)",
                      opacity: 1,
                      cursor: "default",
                      transform: "none",
                      border:
                        selectedAnswer === index ? "3px solid #AAA" : "none",
                    },
                  }}
                  onClick={() => handleAnswerClick(index)}
                  disabled={
                    selectedAnswer !== null ||
                    feedbackColors[index] === "#757575"
                  }
                >
                  {answer.text}
                </Button>
              </Grid>
            ))}
            {!currentQuestion && !isGameLoading && (
              <Grid item xs={12}>
                <Typography color="gray" align="center" sx={{ mt: 4 }}>
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
