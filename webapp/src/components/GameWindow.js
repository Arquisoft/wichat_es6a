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
import { keyframes } from "@mui/system";
import { darken } from "@mui/material/styles";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import BalanceIcon from "@mui/icons-material/Balance";
// --- Paleta Azul ---
const PALETTE = {
  federalBlue: "#03045eff", // Darkest Blue
  honoluluBlue: "#0077b6ff", // Medium Blue
  pacificCyan: "#00b4d8ff", // Lighter Blue
  nonPhotoBlue: "#90e0efff", // Very Light Blue
  lightCyan: "#caf0f8ff", // Lightest Blue
};

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// --- Colores de Feedback ---
const FEEDBACK_COLORS = {
  correctBg: "#a5d6a7", // Verde claro (fondo)
  correctText: PALETTE.federalBlue, // Texto oscuro sobre verde
  incorrectBg: "#ef9a9a", // Rojo claro (fondo)
  incorrectText: PALETTE.federalBlue, // Texto oscuro sobre rojo
  eliminatedBg: "#bdbdbd", // Gris medio (fondo)
  eliminatedText: "#757575", // Texto gris oscuro
  selectedBorder: PALETTE.federalBlue, // Borde para respuesta seleccionada
};

// --- Valores por defecto ---
const defaultDifficulty = {
  name: "Medio",
  questionCount: 5,
  timePerQuestion: 30,
};
const defaultCategory = { name: "Variado", endpoint: "/variado" };

// --- Componente Principal ---
export function GameWindow({ gameInstance }) {
  //NOSONAR
  const navigate = useNavigate();
  const location = useLocation();

  const { category = defaultCategory, difficulty = defaultDifficulty } =
    location.state || {};

  // --- Referencias y Estado ---
  const gameRef = useRef(gameInstance || new Game(navigate));
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedbackStates, setFeedbackStates] = useState([]); // Cambiado de feedbackColors
  const [hasUsedFiftyFifty, setHasUsedFiftyFifty] = useState(false);
  const [hasUsedAskAI, setHasUsedAskAI] = useState(false);
  const [hasUsedHint, setHasUsedHint] = useState(false);
  const [questionImage, setQuestionImage] = useState(null);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const chatCluesRef = useRef(null);
  const [isImageActuallyLoading, setIsImageActuallyLoading] = useState(false);
  const [imageWidth, setImageWidth] = useState(0);

  // --- Configuración de Endpoints y API Key ---
  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const apiKey =
    process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  // --- Efecto de Inicialización del Juego ---
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    const initializeGame = async () => {
      setIsGameLoading(true);
      console.log(`[init] Initializing game...`);
      try {
        await gameRef.current.init(category, difficulty);
        console.log(
          `[init] ${gameRef.current.questions.length} questions loaded.`
        );
        const firstQuestion = gameRef.current.getCurrentQuestion();
        if (firstQuestion) {
          setCurrentQuestion(firstQuestion);
          setPoints(gameRef.current.getCurrentPoints());
          setStreak(gameRef.current.getCurrentStreak());
          setFeedbackStates([]); // Usar nuevo nombre de estado
          setSelectedAnswer(null);
          setHasUsedFiftyFifty(false);
          setHasUsedHint(false);
          setHasUsedAskAI(false);
        } else {
          console.error("[init] No questions! Ending game.");
          gameRef.current.endGame();
        }
      } catch (error) {
        console.error("[init] Critical error:", error);
        try {
          // Fallback
          await gameRef.current.TestingInit(difficulty.questionCount);
          const firstQuestion = gameRef.current.getCurrentQuestion();
          if (firstQuestion) setCurrentQuestion(firstQuestion);
          else gameRef.current.endGame();
        } catch (fallbackError) {
          console.error("[init] Fallback error:", fallbackError);
          gameRef.current.endGame();
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
    // Lógica de actualización de imagen (sin cambios funcionales)
    const game = gameRef.current;
    if (currentQuestion) {
      const imageUrl = currentQuestion.imageUrl;
      const nextIndex = game.questionIndex + 1;
      if (nextIndex < game.questions.length) {
        const nextImageUrl = game.questions[nextIndex].imageUrl;
        if (nextImageUrl) {
          const img = new Image();
          img.src = nextImageUrl;
        }
      }
      setIsImageActuallyLoading(!!imageUrl);
      setQuestionImage(imageUrl);
    } else {
      setQuestionImage(null);
      setIsImageActuallyLoading(false);
      setImageWidth(0); // Resetear ancho si no hay pregunta/imagen
    }
  }, [currentQuestion]);

  // --- Manejador de Clic en Respuesta ---
  const handleAnswerClick = useCallback(
    (index) => {
      if (selectedAnswer !== null || !currentQuestion) return;
      const correctIndex = currentQuestion.answers.findIndex(
        (ans) => ans.isCorrect
      );
      setSelectedAnswer(index);
      const newFeedbackStates = currentQuestion.answers.map((_, i) => {
        if (i === correctIndex) return "success";
        if (i === index && i !== correctIndex) return "error";
        return null;
      });
      setFeedbackStates(newFeedbackStates);
      setTimeout(() => {
        gameRef.current.answerQuestion(index);
        const nextQ = gameRef.current.getCurrentQuestion();
        setCurrentQuestion(nextQ);
        setPoints(gameRef.current.getCurrentPoints());
        setStreak(gameRef.current.getCurrentStreak());
        if (chatCluesRef.current?.disableChat)
          chatCluesRef.current.disableChat();
        setSelectedAnswer(null);
        setFeedbackStates([]); // Usa nuevo nombre
      }, 1500);
    },
    [currentQuestion, selectedAnswer]
  );

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
    const newFeedbackStates = currentQuestion.answers.map((_, i) => {
      if (toRemove.includes(i)) return "eliminated";
      return null;
    });
    setFeedbackStates(newFeedbackStates);
    setHasUsedFiftyFifty(true);
    gameRef.current.useFiftyFifty();
  };

  // --- Manejador para Obtener Pista ---
  const handleGetHint = useCallback(async () => {
    if (!currentQuestion || !chatCluesRef.current || hasUsedHint) return;
    // Activar chat en modo pista (sin input)
    chatCluesRef.current.activateHint();
    chatCluesRef.current.addMessage("IA: Solicitando pista...");
    setHasUsedHint(true);
    try {
      const response = await axios.post(`${apiEndpoint}/getHint`, {
        question: currentQuestion.questionText,
        answers: currentQuestion.answers.map((a) => ({ text: a.text })),
        apiKey,
      });
      const hintMsg = `IA: ${response.data.hint}`;
      chatCluesRef.current.addMessage(hintMsg);
      gameRef.current.useHint();
    } catch (error) {
      setHasUsedHint(false);
      const errorMsg = error.response
        ? `IA: Error del servidor (${error.response.status}) al pedir pista.`
        : `IA: Sin respuesta del servidor al pedir pista.`;
      chatCluesRef.current.addMessage(errorMsg);
      console.error("Hint error:", error);
    }
  }, [currentQuestion, apiEndpoint, apiKey, hasUsedHint]);

  // --- Manejador para Pregunta IA ---
  const handleAskAI = () => {
    if (chatCluesRef.current && !hasUsedAskAI) {
      chatCluesRef.current.enableChat();
      gameRef.current.useAskAI();
      setHasUsedAskAI(true);
    }
  };

  // --- Estilos Comunes para Botones de Comodín ---
  const lifelineButtonStyle = (used, baseColor) => ({
    width: { xs: "80%", sm: "auto" },
    minWidth: "120px",
    bgcolor: baseColor,
    color: "#ffffff",
    opacity: used ? 0.6 : 1,
    transition: "background-color 0.3s, color 0.3s, opacity 0.3s",
    "&:hover": {
      bgcolor: used ? baseColor : darken(baseColor, 0.15),
      opacity: used ? 0.6 : 1,
    },
    "&.Mui-disabled": {
      bgcolor: baseColor,
      color: "#ffffff",
      opacity: used ? 0.6 : 0.5,
    },
  });

  // --- Estado de Carga Inicial ---
  if (isGameLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: PALETTE.lightCyan,
        }}
      >
        <CircularProgress sx={{ color: PALETTE.honoluluBlue }} size={60} />
        <Typography
          color={PALETTE.federalBlue}
          sx={{ mt: 2, fontStyle: "italic" }}
        >
          {" "}
          Cargando preguntas...{" "}
        </Typography>
      </Box>
    );
  }

  // --- Renderizado Principal del Juego ---
  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)`,
        backgroundSize: "200% 200%",
        animation: `${gradientAnimation} 15s ease infinite`, // Animación del gradiente
        minHeight: "100vh",
        p: { xs: 1, sm: 2, md: 3 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 hidden>{currentQuestion?.questionText || "Cargando..."}</h1>
      <Box sx={{ width: "100%", maxWidth: 1200 }}>
        {/* Cabecera */}
        <Typography
          variant="h5"
          align="center"
          fontWeight="bold"
          color={PALETTE.federalBlue}
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
                bgcolor: PALETTE.honoluluBlue,
                borderRadius: 2,
                p: 1.5,
                display: "flex",
                minHeight: { sm: 250, md: 300 },
                boxShadow: 2,
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
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            {/* Contenedor de la imagen */}
            <Box
              sx={{
                height: 300, // Altura fija
                width: imageWidth ? `${imageWidth}px` : "100%",
                maxWidth: "100%",
                position: "relative",
                borderRadius: 4,
                boxShadow: 6,
                overflow: "hidden",
                bgcolor: PALETTE.honoluluBlue,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mx: "auto", // Centrado horizontal explícito
                transition: "width 0.3s ease-in-out",
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
                    color: PALETTE.nonPhotoBlue,
                    zIndex: 1,
                  }}
                />
              )}
              {/* Elemento Imagen */}
              <Box
                component="img"
                key={
                  questionImage ||
                  `default-${currentQuestion?.id || "no-question"}`
                }
                src={questionImage || "/WichatAmigos.png"}
                alt={`Imagen para: ${
                  currentQuestion?.questionText || "Cargando..."
                }`}
                sx={{
                  // *** Estilos originales de la imagen ***
                  height: "100%",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  // --- Colores de la paleta ---
                  backgroundColor: PALETTE.honoluluBlue, // Fondo detrás de la imagen
                  opacity: isImageActuallyLoading ? 0 : 1,
                  transition: "opacity 0.3s ease-in-out",
                }}
                onLoad={(e) => {
                  setIsImageActuallyLoading(false);
                  const { naturalWidth, naturalHeight } = e.target;
                  if (naturalHeight > 0) {
                    const fixedHeight = 300;
                    const scaleFactor = fixedHeight / naturalHeight;
                    const scaledWidth = naturalWidth * scaleFactor;
                    setImageWidth(scaledWidth);
                  } else {
                    setImageWidth(300);
                  }
                }}
                onError={(e) => {
                  setIsImageActuallyLoading(false);
                  console.warn(
                    `Error loading image: ${e.target.src}. Using default.`
                  );
                  e.target.onerror = null;
                  e.target.src = "/WichatAmigos.png";
                  setImageWidth(300); // Ancho fijo para la imagen por defecto
                }}
              />
            </Box>
          </Grid>

          {/* Columna Derecha: Timer y Comodines */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: { xs: "auto", sm: 300 },
                gap: 2,
                mt: { xs: 3, sm: 0 },
              }}
            >
              {currentQuestion && (
                <QuestionTimer
                  keyProp={`timer-${
                    currentQuestion.id || gameRef.current.questionIndex
                  }`}
                  duration={difficulty.timePerQuestion || 30}
                  pauseTimer={selectedAnswer !== null}
                  onComplete={() => {
                    if (selectedAnswer !== null) return;
                    const correctIndex =
                      currentQuestion?.answers.findIndex(
                        (ans) => ans.isCorrect
                      ) ?? -1;
                    const newFeedbackStates =
                      currentQuestion?.answers.map((_, i) =>
                        i === correctIndex ? "success" : "error"
                      ) || [];
                    setFeedbackStates(newFeedbackStates); // Usa estado refactorizado
                    setTimeout(() => {
                      gameRef.current.answerQuestion(-1, true);
                      const nextQ = gameRef.current.getCurrentQuestion();
                      setCurrentQuestion(nextQ);
                      setPoints(gameRef.current.getCurrentPoints());
                      setStreak(gameRef.current.getCurrentStreak());
                      setSelectedAnswer(null);
                      setFeedbackStates([]); // Usa estado refactorizado
                    }, 1500);
                    return { shouldRepeat: false };
                  }}
                  colors={[
                    PALETTE.honoluluBlue,
                    PALETTE.pacificCyan,
                    PALETTE.nonPhotoBlue,
                    PALETTE.nonPhotoBlue,
                  ]}
                  trailColor={PALETTE.nonPhotoBlue}
                  textColor={PALETTE.federalBlue}
                />
              )}
              <Button
                onClick={handleGetHint}
                data-testid="hint-button"
                disabled={
                  selectedAnswer !== null || hasUsedHint || !currentQuestion
                }
                startIcon={<LightbulbIcon />}
                sx={lifelineButtonStyle(hasUsedHint, "#2e7d32")}
              >
                Pista
              </Button>

              <Button
                onClick={handleAskAI}
                data-testid="ask-ai-button"
                disabled={
                  selectedAnswer !== null || hasUsedAskAI || !currentQuestion
                }
                startIcon={<SmartToyIcon />}
                sx={lifelineButtonStyle(hasUsedAskAI, "#1565c0")}
              >
                Pregunta IA
              </Button>

              <Button
                onClick={handleFiftyFifty}
                data-testid="fifty-fifty-button"
                disabled={
                  selectedAnswer !== null ||
                  hasUsedFiftyFifty ||
                  !currentQuestion
                }
                startIcon={<BalanceIcon />}
                sx={lifelineButtonStyle(hasUsedFiftyFifty, "#ef6c00")}
              >
                50 / 50
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Sección Inferior: Pregunta y Respuestas */}
        <Box
          sx={{
            mt: { xs: 4, md: 6 },
            mx: "auto",
            maxWidth: { xs: "95%", sm: 700 },
            width: "100%",
          }}
        >
          {/* Caja Pregunta/Puntos */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              minHeight: "3.5em",
              bgcolor: PALETTE.honoluluBlue,
              borderRadius: 2,
              p: 2,
              boxShadow: 3,
            }}
          >
            <Typography
              variant="h6"
              color="#ffffff"
              sx={{ textAlign: "left", flexGrow: 1, mr: 2, fontWeight: "500" }}
            >
              {currentQuestion?.questionText || "Cargando pregunta..."}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <Typography
                variant="h6"
                color={PALETTE.nonPhotoBlue}
                sx={{ mr: 1 }}
              >
                Pts: {points}
              </Typography>
              <WhatshotIcon sx={{ color: "#f44336", mr: 0.5 }} />
              <Typography variant="h6" sx={{ color: "#f44336" }}>
                {streak}
              </Typography>
            </Box>
          </Box>

          {/* Grid Respuestas */}
          <Grid container spacing={2} mt={1}>
            {currentQuestion?.answers.map((answer, index) => {
              const feedbackState = feedbackStates[index];
              const isSelected = selectedAnswer === index;
              const isDisabled =
                selectedAnswer !== null || feedbackState === "eliminated";
              let currentBgColor = PALETTE.honoluluBlue,
                currentTextColor = "#ffffff",
                currentHoverBgColor = PALETTE.pacificCyan;
              let currentBorder = "none",
                currentOpacity = 1,
                hoverTransform = "scale(1.02)",
                activeTransform = "scale(0.98)",
                boxShadow = "0px 2px 4px rgba(0,0,0,0.2)";

              if (feedbackState === "success") {
                currentBgColor = FEEDBACK_COLORS.correctBg;
                currentTextColor = FEEDBACK_COLORS.correctText;
                currentHoverBgColor = "#81c784";
              } else if (feedbackState === "error") {
                currentBgColor = FEEDBACK_COLORS.incorrectBg;
                currentTextColor = FEEDBACK_COLORS.incorrectText;
                currentHoverBgColor = "#e57373";
              } else if (feedbackState === "eliminated") {
                currentBgColor = FEEDBACK_COLORS.eliminatedBg;
                currentTextColor = FEEDBACK_COLORS.eliminatedText;
                currentHoverBgColor = FEEDBACK_COLORS.eliminatedBg;
                currentOpacity = 0.6;
                hoverTransform = "none";
                activeTransform = "none";
                boxShadow = "none";
              } else if (isDisabled && !isSelected) {
                currentBgColor = PALETTE.honoluluBlue;
                currentTextColor = PALETTE.lightCyan;
                currentHoverBgColor = PALETTE.honoluluBlue;
                currentOpacity = 0.6;
                hoverTransform = "none";
                activeTransform = "none";
                boxShadow = "none";
              }

              if (isSelected) {
                const borderColor =
                  feedbackState === "success"
                    ? "#4caf50"
                    : feedbackState === "error"
                    ? "#f44336"
                    : FEEDBACK_COLORS.selectedBorder;
                currentBorder = `3px solid ${borderColor}`;
              }

              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  key={`${currentQuestion.id || index}-${answer.text}-${index}`}
                >
                  {" "}
                  {/* Key más única */}
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={isDisabled}
                    onClick={() => handleAnswerClick(index)}
                    data-testid={`answer-button-${index}`}
                    sx={{
                      minHeight: "3.5em",
                      borderRadius: 2,
                      p: 1.5,
                      fontSize: "1rem",
                      fontWeight: "500",
                      textTransform: "none",
                      bgcolor: currentBgColor,
                      color: currentTextColor,
                      border: currentBorder,
                      opacity: currentOpacity,
                      boxShadow: isDisabled ? "none" : 1,
                      transition:
                        "background-color 0.3s, color 0.3s, border 0.3s, transform 0.1s, opacity 0.3s",
                      "&:hover": {
                        bgcolor: currentHoverBgColor,
                        transform: hoverTransform,
                        opacity: isDisabled ? currentOpacity : 1,
                        boxShadow: !isDisabled ? 3 : "none",
                      },
                      "&:active": { transform: activeTransform },
                      "&.Mui-disabled": {
                        bgcolor: currentBgColor,
                        color: currentTextColor,
                        opacity: currentOpacity,
                        border: currentBorder,
                        boxShadow: "none",
                        ".Mui-disabled": { color: currentTextColor },
                      },
                    }}
                  >
                    {answer.text}
                  </Button>
                </Grid>
              );
            })}
            {/* Mensaje Fin */}
            {!currentQuestion && !isGameLoading && (
              <Grid item xs={12}>
                <Typography
                  color={PALETTE.honoluluBlue}
                  align="center"
                  sx={{ mt: 4, fontStyle: "italic" }}
                >
                  {gameRef.current.isGameFinished
                    ? gameRef.current.isGameFinished()
                      ? "Fin de la partida. Redirigiendo a resultados..."
                      : "No hay más preguntas disponibles o error."
                    : "Calculando resultado..."}
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
