// src/components/GameWindow.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import { Typography, Button, Box, CircularProgress } from "@mui/material";
import { Whatshot as WhatshotIcon } from "@mui/icons-material";
import ChatClues from "./ChatClues"; // Asumiendo que está en la misma carpeta o ruta correcta
import Game from "./Game"; // Importar la clase Game actualizada
import axios from "axios";
import QuestionTimer from "./QuestionTimer"; // Importar el componente Timer

// --- Valores por defecto fuera del componente ---
// Dificultad por defecto si no se recibe nada (ej. acceso directo a /game)
const defaultDifficulty = {
  name: "Medio",
  questionCount: 5,
  timePerQuestion: 30,
};
// Categoría por defecto
const defaultCategory = { name: "Variado", endpoint: "/variado" };

// --- Componente Principal ---
export function GameWindow() {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para acceder al estado de navegación

  // --- Obtener categoría y dificultad del estado de navegación ---
  // Si location.state no existe, usa objetos vacíos para evitar errores
  // Luego, desestructura con valores por defecto definidos arriba
  const { category = defaultCategory, difficulty = defaultDifficulty } =
    location.state || {};

  // --- Referencias y Estado ---
  const gameRef = useRef(new Game(navigate)); // Instancia de la clase Game
  const [currentQuestion, setCurrentQuestion] = useState(null); // Objeto Question actual
  const [points, setPoints] = useState(0); // Puntuación actual
  const [streak, setStreak] = useState(0); // Racha actual
  const [selectedAnswer, setSelectedAnswer] = useState(null); // Índice de la respuesta seleccionada
  const [feedbackColors, setFeedbackColors] = useState([]); // Colores para feedback visual de respuestas
  const [hasUsedFiftyFifty, setHasUsedFiftyFifty] = useState(false); // Si se usó 50/50 en la pregunta actual
  const [questionImage, setQuestionImage] = useState(null); // URL/base64 de la imagen
  const [isGameLoading, setIsGameLoading] = useState(true); // Estado de carga inicial
  const [generatedImagesMap, setGeneratedImagesMap] = useState(new Map()); // Mapa para imágenes generadas
  const isInitializedRef = useRef(false); // Para evitar doble inicialización
  const chatCluesRef = useRef(null); // Referencia al componente ChatClues

  // --- Configuración de Endpoints y API Key ---
  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8003";
  // Obtener API Key de entorno (puede ser usada por /generateImages, /getHint, etc.)
  // NOTA: Pasar la API key en cada petición como en el backend original es más seguro
  // que depender solo de la variable de entorno del frontend si esta fuera pública.
  // El backend ya tiene lógica para usar la key del body o la del entorno del backend.
  const apiKey =
    process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY; // Ajusta según tu variable de entorno

  // --- Efecto de Inicialización del Juego y Generación de Imágenes ---
  useEffect(() => {
    // Evitar re-inicialización si ya se hizo (importante con React StrictMode)
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initializeGameAndImages = async () => {
      setIsGameLoading(true); // Mostrar indicador de carga
      console.log(
        `[init] Initializing game with category "${category.name}" and difficulty "${difficulty.name}" (${difficulty.questionCount} questions, ${difficulty.timePerQuestion}s each)...`
      );

      try {
        // --- Inicializar la instancia de Game ---
        // Pasar category y difficulty.questionCount al método init
        await gameRef.current.init(category, difficulty.questionCount);
        console.log(
          `[init] Game instance initialized. ${gameRef.current.questions.length} questions loaded.`
        );

        // --- Generar Imágenes (si hay preguntas) ---
        if (gameRef.current.questions && gameRef.current.questions.length > 0) {
          const questionsPayload = gameRef.current.questions.map((q) => ({
            question: q.questionText, // Enviar solo el texto de la pregunta
          }));

          console.log(
            `[init] Calling POST ${apiEndpoint}/generateImages for ${questionsPayload.length} questions...`
          );
          try {
            const response = await axios.post(`${apiEndpoint}/generateImages`, {
              questions: questionsPayload,
              apiKey: apiKey, // Pasar la API key si es necesaria para tu backend
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
                    }. Setting to null.`
                  );
                  // Guardar null explícitamente para saber que falló
                  if (imgData && imgData.questionText) {
                    imageMap.set(imgData.questionText, null);
                  }
                }
              });
              setGeneratedImagesMap(imageMap); // Guardar el mapa de imágenes
              console.log(
                `[init] Images map created with ${imageMap.size} entries.`
              );
            } else {
              console.error(
                "[init] Error response from /generateImages:",
                response.status,
                response.data?.error || "No error details"
              );
            }
          } catch (imageError) {
            console.error(
              "[init] Failed to fetch or process images:",
              imageError.response?.data || imageError.message
            );
            // Continuar sin imágenes si falla, el mapa estará vacío
          }
        } else {
          console.warn(
            "[init] No questions loaded, skipping image generation."
          );
        }

        // --- Establecer la primera pregunta en el estado del componente ---
        const firstQuestion = gameRef.current.getCurrentQuestion();
        if (firstQuestion) {
          console.log("[init] Setting first question.");
          setCurrentQuestion(firstQuestion);
          setPoints(gameRef.current.getCurrentPoints());
          setStreak(gameRef.current.getCurrentStreak());
          setFeedbackColors([]); // Resetear colores de feedback
          setSelectedAnswer(null); // Resetear respuesta seleccionada
          setHasUsedFiftyFifty(false); // Resetear estado de 50/50
        } else {
          console.error(
            "[init] No questions available after initialization! Ending game."
          );
          // Si no hay preguntas (ni siquiera de fallback), terminar el juego inmediatamente
          gameRef.current.endGame();
        }
      } catch (error) {
        console.error(
          "[init] Critical error during game initialization:",
          error.response?.data || error.message || error
        );
        // Considerar mostrar un mensaje de error al usuario o redirigir
        // Por ahora, intentará renderizar lo que pueda (probablemente el estado de fin de juego)
      } finally {
        setIsGameLoading(false); // Ocultar indicador de carga
        console.log("[init] Initialization complete.");
      }
    };

    initializeGameAndImages();

    // Dependencias del useEffect: se re-ejecuta si cambia la categoría o la dificultad
    // 'navigate' es estable por el hook, pero incluirlo es buena práctica si se usa dentro
  }, [category, difficulty, navigate, apiKey]); // Añadir apiKey si es relevante para la inicialización

  // --- Efecto para Actualizar la Imagen Mostrada ---
  useEffect(() => {
    if (currentQuestion && currentQuestion.questionText) {
      // Buscar la imagen en el mapa usando el texto de la pregunta actual
      const imageData = generatedImagesMap.get(currentQuestion.questionText);
      // 'undefined' significa que aún no se ha procesado o no existe
      // 'null' significa que falló la generación para esa pregunta
      if (imageData !== undefined) {
        setQuestionImage(imageData); // Establecer la imagen (base64 o null si falló)
        if (imageData === null) {
          console.warn(
            `[Image Effect] Image generation failed previously for: "${currentQuestion.questionText}". Using default.`
          );
        }
      } else {
        // Si aún no está en el mapa (puede pasar brevemente mientras carga)
        if (generatedImagesMap.size > 0 && !isGameLoading) {
          console.warn(
            `[Image Effect] Image key NOT FOUND in map for: "${currentQuestion.questionText}". Using default.`
          );
        }
        setQuestionImage(null); // No mostrar imagen o usar placeholder
      }
    } else {
      setQuestionImage(null); // No hay pregunta actual, no mostrar imagen
    }
  }, [currentQuestion, generatedImagesMap, isGameLoading]); // Dependencias correctas

  // --- Manejador de Clic en Respuesta ---
  const handleAnswerClick = useCallback(
    (index) => {
      if (selectedAnswer !== null || !currentQuestion) return; // Evitar doble clic o clic sin pregunta
      console.log(`[handleAnswerClick] Answer ${index} clicked.`);

      const correctIndex = currentQuestion.answers.findIndex(
        (ans) => ans.isCorrect
      );
      setSelectedAnswer(index); // Marcar respuesta seleccionada (deshabilita botones)

      // Establecer colores de feedback visual (verde=correcta, rojo=incorrecta seleccionada)
      const newColors = currentQuestion.answers.map((_, i) => {
        if (i === correctIndex) return "#a5d6a7"; // Verde claro para la correcta
        if (i === index && i !== correctIndex) return "#ef9a9a"; // Rojo claro para la incorrecta elegida
        return null; // Sin color especial para las otras incorrectas
      });
      setFeedbackColors(newColors);

      // --- Pausa antes de pasar a la siguiente pregunta ---
      // Permite al usuario ver el feedback
      setTimeout(() => {
        console.log("[handleAnswerClick Timeout] Updating game state...");
        // Actualizar estado LÓGICO del juego llamando a la clase Game
        gameRef.current.answerQuestion(index);

        // Obtener la siguiente pregunta (o null si terminó)
        const nextQ = gameRef.current.getCurrentQuestion();
        setCurrentQuestion(nextQ); // Actualizar estado del componente

        // Actualizar puntos y racha en la UI
        setPoints(gameRef.current.getCurrentPoints());
        setStreak(gameRef.current.getCurrentStreak());

        // Resetear estado para la siguiente pregunta
        setSelectedAnswer(null); // Habilitar botones de nuevo
        setFeedbackColors([]); // Quitar colores de feedback
        setHasUsedFiftyFifty(false); // Resetear 50/50 para la nueva pregunta

        console.log(
          "[handleAnswerClick Timeout] Game state update complete for next question (if any)."
        );
      }, 1500); // 1.5 segundos de delay para ver el feedback
    },
    [currentQuestion, selectedAnswer] // Dependencias: se recrea si cambia la pregunta o la selección
  );

  // --- Manejador para Obtener Pista ---
  const handleGetHint = useCallback(async () => {
    if (!currentQuestion || !chatCluesRef.current) {
      console.warn("[handleGetHint] No current question or chat ref.");
      return;
    }

    // Añadir mensaje de espera al chat
    chatCluesRef.current.addMessage("IA: Solicitando pista...");

    try {
      const response = await axios.post(`${apiEndpoint}/getHint`, {
        question: currentQuestion.questionText,
        answers: currentQuestion.answers.map((a) => ({ text: a.text })), // Enviar solo el texto
        apiKey: apiKey, // Pasar API key si el backend la necesita aquí
      });
      const hintMessage = `IA: ${response.data.hint}`;
      chatCluesRef.current.addMessage(hintMessage); // Añadir pista al chat
    } catch (error) {
      let errorMessage = "IA: Error al obtener la pista.";
      if (error.response)
        errorMessage = `IA: Error del servidor (${error.response.status}) al pedir pista.`;
      else if (error.request)
        errorMessage = "IA: Sin respuesta del servidor al pedir pista.";
      chatCluesRef.current.addMessage(errorMessage); // Añadir error al chat
      console.error("Hint error:", error.response?.data || error.message);
    }
  }, [currentQuestion, apiEndpoint, apiKey]); // Dependencias: se recrea si cambia la pregunta o el endpoint/key

  // --- Manejador para Comodín 50/50 ---
  const handleFiftyFifty = () => {
    if (!currentQuestion || selectedAnswer !== null || hasUsedFiftyFifty)
      return; // No usar si ya se respondió, no hay pregunta o ya se usó

    const correctIndex = currentQuestion.answers.findIndex(
      (ans) => ans.isCorrect
    );
    // Encontrar índices de respuestas INCORRECTAS
    const incorrectIndices = currentQuestion.answers
      .map((ans, idx) => (ans.isCorrect ? -1 : idx)) // Mapear a índice o -1 si es correcta
      .filter((idx) => idx !== -1); // Filtrar las correctas

    // Barajar los índices incorrectos y tomar los primeros 2
    const toRemove = incorrectIndices
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    // Crear colores para "deshabilitar" visualmente las eliminadas
    const newColors = currentQuestion.answers.map((_, i) => {
      if (toRemove.includes(i)) return "#757575"; // Gris oscuro para indicar deshabilitado
      return null; // Las otras mantienen su color normal (o el feedback si ya se respondió)
    });

    setFeedbackColors(newColors); // Aplicar los colores
    setHasUsedFiftyFifty(true); // Marcar como usado para esta pregunta (deshabilita el botón)
    gameRef.current.useFiftyFifty(); // Informar a la clase Game que se usó (para puntuación)
    console.log("[handleFiftyFifty] 50/50 applied.");
  };

  // --- Renderizado del Componente ---

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
          bgcolor: "#121212", // Fondo oscuro
        }}
      >
        <CircularProgress color="primary" size={60} />
        <Typography color="white" sx={{ mt: 2, fontStyle: "italic" }}>
          Cargando preguntas y generando imágenes...
        </Typography>
      </Box>
    );
  }

  // Renderizado Principal del Juego
  return (
    <Box
      sx={{
        bgcolor: "#121212", // Fondo oscuro principal
        minHeight: "100vh",
        p: { xs: 1, sm: 2, md: 3 }, // Padding responsivo
        display: "flex", // Usar flex para centrar contenido si es necesario
        flexDirection: "column",
        alignItems: "center", // Centrar horizontalmente el contenido principal
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1200 }}>
        {" "}
        {/* Contenedor para limitar ancho */}
        {/* --- Cabecera: Número de Pregunta --- */}
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
        {/* --- Grid Principal (Chat, Imagen, Timer/Pistas) --- */}
        <Grid
          container
          justifyContent="center" // Centrar items en el contenedor Grid
          spacing={{ xs: 2, md: 4 }} // Espaciado responsivo
          alignItems="stretch" // Estirar items para igualar altura si es posible
        >
          {/* Columna Izquierda: Chat/Pistas (Oculta en XS) */}
          <Grid
            item
            xs={12} // Ocupa todo en extra pequeño
            sm={6} // Mitad en pequeño
            md={3} // Un cuarto en mediano y superior
            sx={{
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
            }} // Ocultar en xs, mostrar como flex en sm+
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
              <ChatClues ref={chatCluesRef} />
            </Box>
          </Grid>

          {/* Columna Central: Imagen */}
          <Grid item xs={12} sm={6} md={4}>
            {" "}
            {/* Ajustar tamaño para mejor proporción */}
            <Box
              sx={{
                width: "100%",
                height: 0,
                paddingBottom: { xs: "75%", sm: "100%" }, // Ratio 4:3 en xs, 1:1 en sm+
                position: "relative",
                borderRadius: 4,
                boxShadow: 6,
                overflow: "hidden", // Para que la imagen no se salga del borde redondeado
                bgcolor: "#333", // Fondo mientras carga o si no hay imagen
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                component="img"
                // Cambiar key si cambia la URL/base64 para forzar recarga si es necesario
                key={
                  questionImage || `default-${currentQuestion?.questionText}`
                }
                src={questionImage || "/WichatAmigos.png"} // Usar imagen por defecto si es null
                alt={`Imagen para: ${
                  currentQuestion?.questionText || "Cargando..."
                }`}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover", // 'cover' suele ser mejor para llenar el espacio
                  display: questionImage === undefined ? "none" : "block", // Ocultar si aún no hay info (undefined)
                }}
                // Fallback si la URL/base64 está mal o no carga
                onError={(e) => {
                  console.warn(
                    `Error loading image: ${e.target.src}. Using default.`
                  );
                  e.target.onerror = null; // Prevenir bucle si la default también falla
                  e.target.src = "/WichatAmigos.png";
                }}
              />
              {/* Indicador de carga específico para la imagen si es necesario */}
              {questionImage === undefined && !isGameLoading && (
                <CircularProgress size={40} sx={{ position: "absolute" }} />
              )}
            </Box>
          </Grid>

          {/* Columna Derecha: Timer y Botones Acción */}
          <Grid item xs={12} sm={6} md={3}>
            {" "}
            {/* Ajustar tamaño */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center", // Centrar verticalmente
                height: "100%", // Ocupar altura de la grid row
                minHeight: { xs: 150, sm: 250, md: 300 }, // Altura mínima
                gap: 2, // Espacio entre elementos
                mt: { xs: 2, sm: 0 }, // Margen superior en pantallas pequeñas
              }}
            >
              {/* --- Temporizador --- */}
              {currentQuestion && ( // Mostrar Timer solo si hay pregunta activa
                <QuestionTimer
                  // Key única que cambia con la pregunta Y la duración
                  keyProp={`timer-${gameRef.current.questionIndex}-${difficulty.timePerQuestion}`}
                  // Duración basada en la dificultad seleccionada
                  duration={difficulty.timePerQuestion}
                  // Pausar el timer si ya se seleccionó una respuesta
                  pauseTimer={selectedAnswer !== null}
                  // Callback cuando el tiempo se agota
                  onComplete={() => {
                    // Solo actuar si no se había seleccionado respuesta ya
                    if (selectedAnswer !== null) return;
                    console.log("[onComplete Timer] Time's up!");
                    setSelectedAnswer(-1); // Marcar como timeout (índice inválido)

                    // Mostrar feedback de timeout (marcar correcta e incorrectas)
                    const correctIndex =
                      currentQuestion?.answers.findIndex(
                        (ans) => ans.isCorrect
                      ) ?? -1;
                    const newColors =
                      currentQuestion?.answers.map(
                        (_, i) => (i === correctIndex ? "#a5d6a7" : "#ef9a9a") // Marcar todas
                      ) || [];
                    setFeedbackColors(newColors);

                    // Delay para mostrar feedback antes de pasar
                    setTimeout(() => {
                      console.log(
                        "[onComplete Timer Timeout] Updating game state for timeout..."
                      );
                      gameRef.current.answerQuestion(-1, true); // Llamar a la lógica del juego con isTimeout=true
                      const nextQ = gameRef.current.getCurrentQuestion();
                      setCurrentQuestion(nextQ); // Avanzar UI a siguiente pregunta
                      setPoints(gameRef.current.getCurrentPoints());
                      setStreak(gameRef.current.getCurrentStreak());
                      setSelectedAnswer(null); // Resetear selección
                      setFeedbackColors([]); // Resetear colores
                      setHasUsedFiftyFifty(false); // Resetear 50/50
                      console.log(
                        "[onComplete Timer Timeout] Game state update complete."
                      );
                    }, 1500); // 1.5s para ver feedback

                    // Indicar al timer que no se repita (ya manejamos la lógica)
                    return { shouldRepeat: false };
                  }}
                />
              )}
              {/* --- Botones de Acción --- */}
              <Button
                variant="contained"
                color="secondary"
                onClick={handleGetHint}
                disabled={selectedAnswer !== null || !currentQuestion} // Deshabilitar si ya respondió o no hay pregunta
              >
                Pista
              </Button>
              <Button
                variant="contained"
                onClick={handleFiftyFifty}
                // Deshabilitar si ya respondió, no hay pregunta, o ya se usó 50/50
                disabled={
                  selectedAnswer !== null ||
                  hasUsedFiftyFifty ||
                  !currentQuestion
                }
                sx={{
                  bgcolor: "#f06292", // Rosa
                  color: "#fff",
                  "&:hover": { bgcolor: "#ec407a" },
                  "&:disabled": { bgcolor: "#bdbdbd", color: "#757575" }, // Gris deshabilitado
                }}
              >
                50 / 50
              </Button>
            </Box>
          </Grid>
        </Grid>{" "}
        {/* Fin Grid Principal */}
        {/* --- Sección Inferior: Texto Pregunta y Botones Respuesta --- */}
        <Box
          sx={{
            mt: { xs: 3, md: 5 },
            mx: "auto",
            maxWidth: { xs: "95%", sm: 700 },
            width: "100%",
          }}
        >
          {" "}
          {/* Ancho máximo */}
          {/* Contenedor para Pregunta, Puntos y Racha */}
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
              {currentQuestion
                ? currentQuestion.questionText
                : "Cargando pregunta..."}
            </Typography>
            {/* Puntos y Racha */}
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
          {/* Grid para botones de respuesta */}
          <Grid container spacing={2} mt={1}>
            {currentQuestion?.answers.map((answer, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                key={`${currentQuestion.questionText}-${index}`}
              >
                {" "}
                {/* Usar sm={6} para 2 columnas en pantallas pequeñas */}
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    minHeight: "3.5em", // Altura mínima
                    borderRadius: 2,
                    p: 1.5,
                    fontSize: "1rem",
                    bgcolor:
                      feedbackColors[index] || // Color de feedback (verde/rojo/gris)
                      (selectedAnswer !== null ? "#757575" : "#1976d2"), // Gris si se respondió y no es esta, o azul normal
                    color: "white",
                    border:
                      selectedAnswer === index ? "3px solid #FFF" : "none", // Borde blanco si es la seleccionada
                    transition:
                      "background-color 0.3s, border 0.3s, transform 0.1s",
                    "&:hover": {
                      bgcolor:
                        feedbackColors[index] || // Mantener color feedback al pasar ratón
                        (selectedAnswer !== null ? "#757575" : "#1565c0"), // Gris o azul más oscuro
                      transform:
                        selectedAnswer === null &&
                        !feedbackColors[index]?.startsWith("#75")
                          ? "scale(1.02)"
                          : "none", // Escala si no se respondió y no está deshabilitada por 50/50
                    },
                    "&:active": {
                      transform:
                        selectedAnswer === null &&
                        !feedbackColors[index]?.startsWith("#75")
                          ? "scale(0.98)"
                          : "none",
                    },
                    // Estilo específico cuando está deshabilitado
                    "&:disabled": {
                      bgcolor: feedbackColors[index] || "#757575",
                      color:
                        feedbackColors[index] === "#757575"
                          ? "#aaa"
                          : "rgba(255, 255, 255, 0.7)", // Color de texto deshabilitado
                      opacity: 1, // Opacidad normal para ver bien el color de feedback
                      cursor: "default",
                      transform: "none",
                      border:
                        selectedAnswer === index ? "3px solid #AAA" : "none", // Borde gris si estaba seleccionada
                    },
                  }}
                  onClick={() => handleAnswerClick(index)}
                  // Deshabilitar si ya se seleccionó una respuesta O si esta respuesta fue eliminada por 50/50
                  disabled={
                    selectedAnswer !== null ||
                    feedbackColors[index] === "#757575"
                  }
                >
                  {answer.text}
                </Button>
              </Grid>
            ))}
            {/* Mensaje si no hay pregunta actual y no está cargando (fin de juego o error) */}
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
          </Grid>{" "}
          {/* Fin Grid Respuestas */}
        </Box>{" "}
        {/* Fin Sección Inferior */}
      </Box>{" "}
      {/* Fin Contenedor Ancho Máximo */}
    </Box>
  );
}

export default GameWindow;
