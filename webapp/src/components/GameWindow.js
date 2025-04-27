// src/components/GameWindow.js

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Grid,
  Typography,
  Button,
  Box,
  CircularProgress,
  keyframes,
} from "@mui/material";
import { Whatshot as WhatshotIcon } from "@mui/icons-material";
import ChatClues from "./ChatClues";
import Game from "./Game";
import axios from "axios";
import QuestionTimer from "./QuestionTimer";

// --- Paleta Azul ---
const PALETTE = {
  federalBlue: "#03045eff",
  honoluluBlue: "#0077b6ff",
  pacificCyan: "#00b4d8ff",
  nonPhotoBlue: "#90e0efff",
  lightCyan: "#caf0f8ff",
};

// --- Colores de Feedback ---
const FEEDBACK_COLORS = {
  correctBg: "#a5d6a7",
  correctBorder: "#4caf50",
  incorrectBg: "#ef9a9a",
  incorrectBorder: "#f44336",
  eliminatedBg: "#757575",
};

// Keyframes
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
  const [currentQuestion, setCurrentQuestion] = useState(null);
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

  // --- Configuración ---
  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8003";
  const apiKey =
    process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY; // Advertencia: Uso en cliente

  // --- Efectos ---
  useEffect(() => {
    // Inicialización
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    const initializeGame = async () => {
      setIsGameLoading(true);
      try {
        await gameRef.current.init(category, difficulty);
        const firstQuestion = gameRef.current.getCurrentQuestion();
        if (firstQuestion) {
          setCurrentQuestion(firstQuestion);
          setPoints(gameRef.current.getCurrentPoints());
          setStreak(gameRef.current.getCurrentStreak());
          setFeedbackColors([]);
          setSelectedAnswer(null);
          setHasUsedFiftyFifty(false);
          setHasUsedHint(false);
          setHasUsedAskAI(false);
        } else {
          gameRef.current.endGame();
        }
      } catch (error) {
        console.error("Initialization error:", error);
        try {
          // Fallback
          await gameRef.current.TestingInit(difficulty.questionCount);
          const firstQuestion = gameRef.current.getCurrentQuestion();
          if (firstQuestion) setCurrentQuestion(firstQuestion);
          else gameRef.current.endGame();
        } catch (fallbackError) {
          console.error("Fallback init error:", fallbackError);
          gameRef.current.endGame();
        }
      } finally {
        setIsGameLoading(false);
      }
    };
    initializeGame();
  }, [category, difficulty, navigate]);

  useEffect(() => {
    // Actualización de imagen
    const game = gameRef.current;
    if (currentQuestion) {
      const imageUrl = currentQuestion.imageUrl;
      const nextIndex = game.questionIndex + 1;
      if (nextIndex < game.questions.length) {
        const nextImageUrl = game.questions[nextIndex].imageUrl;
        if (nextImageUrl) {
          const img = new Image();
          img.src = nextImageUrl; // Precarga
        }
      }
      setIsImageActuallyLoading(!!imageUrl);
      setQuestionImage(imageUrl);
    } else {
      setQuestionImage(null);
      setIsImageActuallyLoading(false);
    }
  }, [currentQuestion]);

  // --- Handlers ---
  const handleAnswerClick = useCallback(
    (index) => {
      // Manejo de clic en respuesta
      if (selectedAnswer !== null || !currentQuestion) return;
      const correctIndex = currentQuestion.answers.findIndex(
        (ans) => ans.isCorrect
      );
      setSelectedAnswer(index);
      const newColors = currentQuestion.answers.map((_, i) => {
        if (i === correctIndex) return "success";
        if (i === index && i !== correctIndex) return "error";
        return null;
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
      }, 1500);
    },
    [currentQuestion, selectedAnswer]
  );

  const handleGetHint = useCallback(async () => {
    // Obtener pista
    if (!currentQuestion || !chatCluesRef.current || hasUsedHint) return;
    chatCluesRef.current.addMessage("IA: Solicitando pista...");
    setHasUsedHint(true);
    try {
      const response = await axios.post(`${apiEndpoint}/getHint`, {
        question: currentQuestion.questionText,
        answers: currentQuestion.answers.map((a) => ({ text: a.text })),
        apiKey: apiKey,
      });
      const hintMessage = `IA: ${response.data.hint}`;
      chatCluesRef.current.addMessage(hintMessage);
      gameRef.current.useHint();
    } catch (error) {
      setHasUsedHint(false); // Permitir reintentar si falla
      let errorMessage = "IA: Error al obtener la pista.";
      if (error.response)
        errorMessage = `IA: Error del servidor (${error.response.status}) al pedir pista.`;
      else if (error.request)
        errorMessage = "IA: Sin respuesta del servidor al pedir pista.";
      chatCluesRef.current.addMessage(errorMessage);
      console.error("Hint error:", error);
    }
  }, [currentQuestion, apiEndpoint, apiKey, hasUsedHint]);

  const handleFiftyFifty = useCallback(() => {
    // Comodín 50/50
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
    const newColors = currentQuestion.answers.map((_, i) =>
      toRemove.includes(i) ? "eliminated" : null
    );
    setFeedbackColors(newColors);
    setHasUsedFiftyFifty(true);
    gameRef.current.useFiftyFifty();
  }, [currentQuestion, selectedAnswer, hasUsedFiftyFifty]);

  const handleAskAI = useCallback(() => {
    // Activar chat IA
    if (chatCluesRef.current && !hasUsedAskAI) {
      chatCluesRef.current.enableChat();
      gameRef.current.useAskAI();
      setHasUsedAskAI(true);
    }
  }, [hasUsedAskAI]);

  // --- Renderizado ---
  if (isGameLoading) {
    // Estado de carga inicial
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)",
          backgroundSize: "200% 200%",
          animation: `${gradientAnimation} 15s ease infinite`,
          color: PALETTE.federalBlue,
        }}
      >
        <CircularProgress sx={{ color: PALETTE.honoluluBlue }} size={60} />
        <Typography color="inherit" sx={{ mt: 2, fontStyle: "italic" }}>
          {" "}
          Cargando preguntas...{" "}
        </Typography>
      </Box>
    );
  }

  return (
    // Contenedor Principal del Juego
    <Box
      sx={{
        background: "linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)",
        backgroundSize: "200% 200%",
        animation: `${gradientAnimation} 15s ease infinite`,
        color: PALETTE.federalBlue,
        minHeight: "calc(100vh - 0px)",
        p: { xs: 1, sm: 2, md: 3 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1200 }}>
        {/* Cabecera: Número de Pregunta */}
        <Typography
          variant="h5"
          align="center"
          fontWeight="bold"
          color="inherit"
          sx={{ mb: { xs: 3, md: 5 }, mt: 3 }}
        >
          Pregunta {currentQuestion ? gameRef.current.questionIndex + 1 : "-"} /{" "}
          {gameRef.current.questions.length || "-"}
        </Typography>

        {/* Grid Principal (Chat | Imagen | Timer/Comodines) */}
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
                p: 1,
                display: "flex",
                minHeight: { sm: 250, md: 300 },
                color: PALETTE.lightCyan,
              }}
            >
              {currentQuestion && (
                <ChatClues
                  ref={chatCluesRef}
                  actualQuestion={currentQuestion.questionText}
                  answers={currentQuestion.answers}
                />
              )}
            </Box>
          </Grid>

          {/* Columna Central: Imagen */}
          <Grid item xs={12} sm={6} md={4}>
            <Box
              sx={{
                width: "100%",
                height: 0,
                paddingBottom: { xs: "75%", sm: "100%", md: "100%" },
                position: "relative",
                borderRadius: 4,
                boxShadow: 6,
                overflow: "hidden",
                bgcolor: PALETTE.honoluluBlue,
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
                    color: PALETTE.nonPhotoBlue,
                    zIndex: 1,
                  }}
                />
              )}
              <Box
                component="img"
                key={questionImage || `default-${currentQuestion?.id}`}
                src={questionImage || "/WichatAmigos.png"}
                alt={`Imagen para: ${currentQuestion?.questionText || "..."}`}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                  opacity: isImageActuallyLoading ? 0 : 1,
                  transition: "opacity 0.3s ease-in-out",
                  backgroundColor: PALETTE.honoluluBlue,
                }}
                onLoad={() => setIsImageActuallyLoading(false)}
                onError={(e) => {
                  setIsImageActuallyLoading(false);
                  e.target.onerror = null;
                  e.target.src = "/WichatAmigos.png";
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
                mt: { xs: 2, sm: 0 },
              }}
            >
              {/* Timer */}
              {currentQuestion && (
                <QuestionTimer
                  keyProp={`timer-${
                    currentQuestion?.id || gameRef.current.questionIndex
                  }`}
                  duration={difficulty.timePerQuestion || 30}
                  pauseTimer={selectedAnswer !== null}
                  onComplete={() => {
                    /* Lógica onComplete */ if (selectedAnswer !== null) return;
                    const correctIndex =
                      currentQuestion?.answers.findIndex(
                        (ans) => ans.isCorrect
                      ) ?? -1;
                    const newColors =
                      currentQuestion?.answers.map((_, i) =>
                        i === correctIndex ? "success" : "error"
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
                    }, 1500);
                    return { shouldRepeat: false };
                  }}
                  colors={[
                    PALETTE.honoluluBlue,
                    PALETTE.pacificCyan,
                    PALETTE.nonPhotoBlue,
                    PALETTE.nonPhotoBlue,
                  ]}
                  trailColor={PALETTE.lightCyan}
                  textColor={PALETTE.federalBlue}
                />
              )}
              {/* Botones Comodín con estilos diferenciados para estado 'usado' */}
              <Button
                variant="contained"
                onClick={handleGetHint}
                disabled={
                  selectedAnswer !== null || hasUsedHint || !currentQuestion
                }
                sx={{
                  bgcolor: hasUsedHint
                    ? PALETTE.federalBlue
                    : PALETTE.pacificCyan,
                  color: hasUsedHint
                    ? PALETTE.honoluluBlue
                    : PALETTE.federalBlue,
                  opacity: hasUsedHint ? 0.5 : 1,
                  transition: "background-color 0.3s, color 0.3s, opacity 0.3s",
                  "&:hover": {
                    bgcolor: hasUsedHint
                      ? PALETTE.federalBlue
                      : PALETTE.nonPhotoBlue,
                  },
                  "&.Mui-disabled": {
                    bgcolor: hasUsedHint
                      ? PALETTE.federalBlue
                      : PALETTE.honoluluBlue,
                    color: hasUsedHint
                      ? PALETTE.honoluluBlue
                      : PALETTE.federalBlue,
                    opacity: hasUsedHint ? 0.5 : 0.6,
                  },
                }}
              >
                {" "}
                Pista{" "}
              </Button>
              <Button
                variant="contained"
                onClick={handleAskAI}
                disabled={
                  selectedAnswer !== null || hasUsedAskAI || !currentQuestion
                }
                sx={{
                  bgcolor: hasUsedAskAI
                    ? PALETTE.federalBlue
                    : PALETTE.pacificCyan,
                  color: hasUsedAskAI
                    ? PALETTE.honoluluBlue
                    : PALETTE.federalBlue,
                  opacity: hasUsedAskAI ? 0.5 : 1,
                  transition: "background-color 0.3s, color 0.3s, opacity 0.3s",
                  "&:hover": {
                    bgcolor: hasUsedAskAI
                      ? PALETTE.federalBlue
                      : PALETTE.nonPhotoBlue,
                  },
                  "&.Mui-disabled": {
                    bgcolor: hasUsedAskAI
                      ? PALETTE.federalBlue
                      : PALETTE.honoluluBlue,
                    color: hasUsedAskAI
                      ? PALETTE.honoluluBlue
                      : PALETTE.federalBlue,
                    opacity: hasUsedAskAI ? 0.5 : 0.6,
                  },
                }}
              >
                {" "}
                Pregunta IA{" "}
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
                  bgcolor: hasUsedFiftyFifty
                    ? PALETTE.federalBlue
                    : PALETTE.pacificCyan,
                  color: hasUsedFiftyFifty
                    ? PALETTE.honoluluBlue
                    : PALETTE.federalBlue,
                  opacity: hasUsedFiftyFifty ? 0.5 : 1,
                  transition: "background-color 0.3s, color 0.3s, opacity 0.3s",
                  "&:hover": {
                    bgcolor: hasUsedFiftyFifty
                      ? PALETTE.federalBlue
                      : PALETTE.nonPhotoBlue,
                  },
                  "&.Mui-disabled": {
                    bgcolor: hasUsedFiftyFifty
                      ? PALETTE.federalBlue
                      : PALETTE.honoluluBlue,
                    color: hasUsedFiftyFifty
                      ? PALETTE.honoluluBlue
                      : PALETTE.federalBlue,
                    opacity: hasUsedFiftyFifty ? 0.5 : 0.6,
                  },
                }}
              >
                {" "}
                50 / 50{" "}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Sección Inferior: Pregunta y Respuestas */}
        <Box
          sx={{
            mt: { xs: 3, md: 5 },
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
              mb: 2,
              minHeight: "3em",
              bgcolor: PALETTE.honoluluBlue, // Fondo azul medio
              borderRadius: 2,
              p: 2,
            }}
          >
            {/* Texto de la Pregunta */}
            <Typography
              variant="h6"
              color="#ffffff"
              sx={{
                textAlign: "left",
                flexGrow: 1,
                mr: 2,
                fontWeight: "bold",
              }}
            >
              {currentQuestion ? currentQuestion.questionText : "..."}
            </Typography>

            {/* Puntos y Racha */}
            <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <Typography
                variant="h6"
                color={PALETTE.nonPhotoBlue}
                sx={{ mr: 1 }}
              >
                {" "}
                Pts: {points}{" "}
              </Typography>
              <WhatshotIcon sx={{ color: PALETTE.nonPhotoBlue, mr: 0.5 }} />{" "}
              <Typography variant="h6" sx={{ color: PALETTE.nonPhotoBlue }}>
                {" "}
                {streak}{" "}
              </Typography>
            </Box>
          </Box>

          {/* Grid Respuestas  */}
          <Grid container spacing={2} mt={1}>
            {currentQuestion?.answers.map((answer, index) => {
              const feedbackState = feedbackColors[index];
              const isSelected = selectedAnswer === index;
              const isDisabled =
                selectedAnswer !== null || feedbackState === "eliminated";
              let bgColor = PALETTE.honoluluBlue,
                hoverBgColor = PALETTE.pacificCyan,
                textColor = "#ffffff";
              let borderColor = "none",
                opacity = 1,
                hoverTransform = "scale(1.02)",
                activeTransform = "scale(0.98)";

              if (feedbackState === "success") {
                bgColor = FEEDBACK_COLORS.correctBg;
                textColor = PALETTE.federalBlue;
                hoverBgColor = "#81c784";
              } else if (feedbackState === "error") {
                bgColor = FEEDBACK_COLORS.incorrectBg;
                textColor = PALETTE.federalBlue;
                hoverBgColor = "#e57373";
              } else if (feedbackState === "eliminated") {
                bgColor = FEEDBACK_COLORS.eliminatedBg;
                textColor = "#ffffff";
                hoverBgColor = FEEDBACK_COLORS.eliminatedBg;
                opacity = 0.7;
                hoverTransform = "none";
                activeTransform = "none";
              } else if (isDisabled && !isSelected) {
                bgColor = PALETTE.honoluluBlue;
                hoverBgColor = PALETTE.honoluluBlue;
                opacity = 0.7;
                textColor = PALETTE.lightCyan;
                hoverTransform = "none";
                activeTransform = "none";
              }
              if (isSelected) {
                borderColor = `3px solid ${
                  feedbackState === "success"
                    ? FEEDBACK_COLORS.correctBorder
                    : feedbackState === "error"
                    ? FEEDBACK_COLORS.incorrectBorder
                    : "#ffffff"
                }`;
              } // Borde blanco por defecto

              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  key={`${currentQuestion.id || index}-${index}`}
                >
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      minHeight: "3.5em",
                      borderRadius: 2,
                      p: 1.5,
                      fontSize: "1rem",
                      fontWeight: "500",
                      bgcolor: bgColor,
                      color: textColor,
                      border: borderColor,
                      opacity: opacity,
                      textTransform: "none",
                      transition:
                        "background-color 0.3s, border 0.3s, transform 0.1s, opacity 0.3s, color 0.3s",
                      "&:hover": {
                        bgcolor: hoverBgColor,
                        transform: hoverTransform,
                        opacity: isDisabled ? opacity : 1,
                        boxShadow: !isDisabled
                          ? "0px 2px 8px rgba(0,0,0,0.2)"
                          : "none",
                      },
                      "&:active": { transform: activeTransform },
                      "&.Mui-disabled": {
                        bgcolor: bgColor,
                        color: textColor,
                        opacity: opacity,
                        cursor: "default",
                        border: borderColor,
                        boxShadow: "none",
                        ".MuiButton-disabled": { color: textColor },
                      },
                    }}
                    onClick={() => handleAnswerClick(index)}
                    disabled={isDisabled}
                  >
                    {answer.text}
                  </Button>
                </Grid>
              );
            })}
            {/* Mensaje de Fin */}
            {!currentQuestion && !isGameLoading && (
              <Grid item xs={12}>
                {" "}
                <Typography
                  color={PALETTE.honoluluBlue}
                  align="center"
                  sx={{ mt: 4 }}
                >
                  {" "}
                  Fin...{" "}
                </Typography>{" "}
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
export default GameWindow;
