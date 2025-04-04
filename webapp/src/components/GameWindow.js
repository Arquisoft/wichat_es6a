import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import { Typography, Button, Box, CircularProgress } from "@mui/material";
import { Whatshot as WhatshotIcon } from "@mui/icons-material";
import ChatClues from "./ChatClues";
import Game from "./Game";
import axios from "axios";
import QuestionTimer from "./QuestionTimer";

export function GameWindow() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category || {
    name: "Variado",
    endpoint: "/variado",
  };
  const gameRef = useRef(new Game(navigate));
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedbackColors, setFeedbackColors] = useState([]);
  const [questionImage, setQuestionImage] = useState(null);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [generatedImagesMap, setGeneratedImagesMap] = useState(new Map());
  const isInitializedRef = useRef(false);
  const chatCluesRef = useRef(null);
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT;
  const apiKey = process.env.GEMINI_API_KEY;

  // --- Efecto de Inicialización del Juego y Generación de Imágenes ---
  useEffect(() => {
    const initializeGameAndImages = async () => {
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;
      setIsGameLoading(true);
      console.log("[init] Initializing game...");

      try {
        console.log("🛠️ API endpoint en tiempo de ejecución:", apiEndpoint);
        await gameRef.current.init(category);
        console.log(
          `[init] Game initialized. ${gameRef.current.questions.length} questions loaded.`
        );

        if (gameRef.current.questions && gameRef.current.questions.length > 0) {
          const questionsPayload = gameRef.current.questions.map((q) => ({
            question: q.questionText,
          }));

          console.log(
            `[init] Calling POST ${apiEndpoint}/generateImages for ${questionsPayload.length} questions...`
          );
          const response = await axios.post(`${apiEndpoint}/generateImages`, {
            questions: questionsPayload,
            apiKey: apiKey,
          });

          if (response.status === 200 && response.data.images) {
            console.log(
              `[init] Received ${response.data.images.length} image results from /generateImages.`
            );
            const imageMap = new Map();
            response.data.images.forEach((imgData) => {
              if (imgData && imgData.questionText && imgData.base64Image) {
                imageMap.set(imgData.questionText, imgData.base64Image);
              } else {
                console.warn(
                  `[init] Missing data or image for question: ${
                    imgData?.questionText || "Unknown"
                  }`
                );
                if (imgData && imgData.questionText) {
                  imageMap.set(imgData.questionText, null);
                }
              }
            });
            setGeneratedImagesMap(imageMap);
            console.log(
              `[init] Images map created with ${imageMap.size} entries.`
            );
          } else {
            console.error(
              "[init] Error response from /generateImages:",
              response.status,
              response.data?.error
            );
          }
        } else {
          console.warn(
            "[init] No questions loaded, skipping image generation."
          );
        }

        const firstQuestion = gameRef.current.getCurrentQuestion();
        if (firstQuestion) {
          console.log("[init] Setting first question.");
          setCurrentQuestion(firstQuestion);
          setPoints(gameRef.current.getCurrentPoints());
          setStreak(gameRef.current.getCurrentStreak());
        } else {
          console.error("[init] No questions available after initialization!");
        }
      } catch (error) {
        console.error(
          "[init] Critical error during game initialization or image generation:",
          error.response?.data || error.message || error
        );
      } finally {
        setIsGameLoading(false);
        console.log(
          "[init] Initialization complete. Game loading state set to false."
        );
      }
    };

    initializeGameAndImages();
  }, [category]);

  // --- Efecto para Actualizar la Imagen Mostrada ---
  useEffect(() => {
    if (currentQuestion && currentQuestion.questionText) {
      const imageData = generatedImagesMap.get(currentQuestion.questionText);
      if (imageData !== undefined) {
        setQuestionImage(imageData);
      } else {
        if (generatedImagesMap.size > 0 && !isGameLoading) {
          console.warn(
            `[Image Effect] Image key NOT FOUND in map for: "${currentQuestion.questionText}". Setting default.`
          );
        }
        setQuestionImage(null);
      }
    } else {
      setQuestionImage(null);
    }
  }, [currentQuestion, generatedImagesMap, isGameLoading]);

  // --- Manejador de Clic en Respuesta ---
  const handleAnswerClick = useCallback(
    (index) => {
      if (selectedAnswer !== null) return;
      console.log(`[handleAnswerClick] Answer ${index} clicked.`);

      const correctIndex = currentQuestion.answers.findIndex(
        (ans) => ans.isCorrect
      );
      setSelectedAnswer(index);

      const newColors = currentQuestion.answers.map((_, i) => {
        if (i === correctIndex) return "#a5d6a7";
        if (i === index && i !== correctIndex) return "#ef9a9a";
        return null;
      });
      setFeedbackColors(newColors);

      // Tiempo de transición entre preguntas: 1.5 segundos
      setTimeout(() => {
        console.log("[handleAnswerClick Timeout] Updating game state...");
        gameRef.current.answerQuestion(index);
        const nextQ = gameRef.current.getCurrentQuestion();
        setCurrentQuestion(nextQ);
        setPoints(gameRef.current.getCurrentPoints());
        setStreak(gameRef.current.getCurrentStreak());
        setSelectedAnswer(null);
        setFeedbackColors([]);
        console.log("[handleAnswerClick Timeout] Game state update complete.");
      }, 1500); // 1.5 segundos
    },
    [currentQuestion, selectedAnswer]
  );

  // --- Manejador para Obtener Pista ---
  const handleGetHint = useCallback(async () => {
    if (
      !currentQuestion ||
      !currentQuestion.answers ||
      currentQuestion.answers.length === 0
    ) {
      if (chatCluesRef.current)
        chatCluesRef.current.addMessage(
          "IA: No hay pregunta o respuestas para una pista."
        );
      return;
    }
    if (chatCluesRef.current)
      chatCluesRef.current.addMessage("IA: Solicitando pista...");

    try {
      const response = await axios.post(`${apiEndpoint}/getHint`, {
        question: currentQuestion.questionText,
        answers: currentQuestion.answers,
        apiKey: apiKey,
      });
      const hintMessage = `IA: ${response.data.hint}`;
      if (chatCluesRef.current) chatCluesRef.current.addMessage(hintMessage);
    } catch (error) {
      let errorMessage = "IA: Error al obtener la pista.";
      if (error.response)
        errorMessage = `IA: Error del servidor: ${error.response.status}`;
      else if (error.request) errorMessage = "IA: Sin respuesta del servidor.";
      if (chatCluesRef.current) chatCluesRef.current.addMessage(errorMessage);
      console.error("Hint error:", error);
    }
  }, [currentQuestion, apiEndpoint, apiKey]);

  // --- Renderizado del Componente ---
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
          Cargando preguntas y generando imágenes...
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
      }}
    >
      <Typography
        variant="h5"
        align="center"
        fontWeight="bold"
        color="white"
        sx={{ mb: { xs: 3, md: 5 }, mt: 3 }}
      >
        Pregunta {currentQuestion ? gameRef.current.questionIndex + 1 : 1} /{" "}
        {gameRef.current.questions.length}
      </Typography>

      <Grid
        container
        justifyContent="center"
        spacing={{ xs: 2, md: 3 }}
        alignItems="stretch"
      >
        {/* Columna Izquierda: Chat/Pistas */}
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          <Box
            sx={{
              width: "100%",
              height: { sm: 300, md: 300 },
              bgcolor: "#222",
              borderRadius: 2,
              p: 1,
              display: "flex",
            }}
          >
            <ChatClues
              ref={chatCluesRef}
              question={currentQuestion?.questionText}
              answers={currentQuestion?.answers}
            />
          </Box>
        </Grid>

        {/* Columna Central: Imagen */}
        <Grid item xs={9} sm={5} md={3}>
          {" "}
          <Box
            sx={{
              width: "100%",
              height: 0,
              paddingBottom: "100%",
              position: "relative",
              borderRadius: 4,
              boxShadow: 6,
              overflow: "hidden",
              bgcolor: "#333",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                component="img"
                key={
                  questionImage || `default-${currentQuestion?.questionText}`
                }
                src={questionImage || "/WichatAmigos.png"}
                alt={`Imagen para: ${
                  currentQuestion?.questionText || "Cargando..."
                }`}
                sx={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/WichatAmigos.png";
                }}
              />
            </Box>
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
              keyProp={`timer-${
                currentQuestion?.id || gameRef.current.questionIndex
              }`}
              duration={30} // 30 segundos
              pauseTimer={selectedAnswer !== null}
              onComplete={() => {
                if (selectedAnswer !== null) return;
                console.log("[onComplete] Timer finished.");
                const correctIndex =
                  currentQuestion?.answers.findIndex((ans) => ans.isCorrect) ??
                  -1;
                setSelectedAnswer(-1);

                const newColors =
                  currentQuestion?.answers.map((_, i) =>
                    i === correctIndex ? "#a5d6a7" : "#ef9a9a"
                  ) || [];
                setFeedbackColors(newColors);

                setTimeout(() => {
                  console.log("[onComplete Timeout] Updating game state...");
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
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleGetHint}
              disabled={selectedAnswer !== null}
            >
              Pista
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Sección Inferior: Texto Pregunta y Botones Respuesta */}
      <Box sx={{ mt: { xs: 3, md: 6 }, mx: "auto", maxWidth: 650 }}>
        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2, minHeight: "3em" }}
        >
          <Typography
            variant="h6"
            color="white"
            sx={{ textAlign: "left", flexGrow: 1, mr: 2 }}
          >
            {currentQuestion ? currentQuestion.questionText : "Cargando..."}
          </Typography>
          <Grid item display="flex" alignItems="center" sx={{ flexShrink: 0 }}>
            <Typography variant="h6" color="#90caf9" sx={{ mr: 1 }}>
              Pts: {points}
            </Typography>
            <WhatshotIcon color="error" sx={{ mr: 0.5 }} />
            <Typography variant="h6" color="error">
              {streak}
            </Typography>
          </Grid>
        </Grid>

        <Grid container spacing={2} mt={1}>
          {currentQuestion?.answers.map((answer, index) => (
            <Grid item xs={12} key={answer.text + index}>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  borderRadius: 2,
                  p: 1.5,
                  fontSize: "1rem",
                  bgcolor: feedbackColors[index] || "#1976d2",
                  color: "white",
                  border: selectedAnswer === index ? "3px solid black" : "none",
                  transition:
                    "background-color 0.3s, border 0.3s, transform 0.1s",
                  "&:hover": {
                    bgcolor: feedbackColors[index]
                      ? feedbackColors[index]
                      : "#1565c0",
                    transform: selectedAnswer === null ? "scale(1.02)" : "none",
                  },
                  "&:active": {
                    transform: selectedAnswer === null ? "scale(0.98)" : "none",
                  },
                  "&:disabled": {
                    bgcolor: feedbackColors[index] || "#1976d2",
                    color: "rgba(255, 255, 255, 0.7)",
                    opacity: 0.8,
                    transform: "none",
                    cursor: "default",
                  },
                }}
                onClick={() => handleAnswerClick(index)}
                disabled={selectedAnswer !== null}
              >
                {answer.text}
              </Button>
            </Grid>
          ))}
          {!currentQuestion && !isGameLoading && (
            <Grid item xs={12}>
              <Typography color="gray" align="center" sx={{ mt: 4 }}>
                Fin del juego o no hay preguntas disponibles.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}

export default GameWindow;
