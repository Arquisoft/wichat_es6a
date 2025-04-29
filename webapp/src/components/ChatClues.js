// src/components/ChatClues.js
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from "react";
import { Grid, Typography, Button, TextField, Paper, Box } from "@mui/material";
import axios from "axios";

// --- Paleta Azul ---
const PALETTE = {
  federalBlue: "#03045eff",
  honoluluBlue: "#0077b6ff",
  pacificCyan: "#00b4d8ff",
  nonPhotoBlue: "#90e0efff",
  lightCyan: "#caf0f8ff",
};

const ChatClues = forwardRef(({ actualQuestion, answers }, ref) => {
  const [messages, setMessages] = useState(["IA: ¿En qué puedo ayudarte?"]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const apiEndpoint =

    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const [inputEnabled, setInputEnabled] = useState(false);


  // Scroll automático
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Enviar mensaje y obtener pista contextual
  const handleSendMessage = async () => {
    if (input.trim() !== "" && inputEnabled) {
      const userQuery = input;
      const userMessage = `Tú: ${userQuery}`; // Mensaje usuario en español
      setMessages((prevMessages) => [...prevMessages, userMessage]); // Mostrar mensaje usuario inmediatamente
      setInput(""); // Limpiar input

      try {
        const response = await axios.post(`${apiEndpoint}/getHintWithQuery`, {
          question: actualQuestion,
          answers: answers,
          userQuery: userQuery,
        });
        const hintMessage = `IA: ${response.data.hint}`;
        setMessages((prevMessages) => [...prevMessages, hintMessage]);
      } catch (error) {
        console.error("Error getting hint:", error);
        let errorMessage =
          "IA: Error al obtener la pista. Inténtalo más tarde.";
        if (error.response) {
          errorMessage = `IA: Error del servidor: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = "IA: Sin respuesta del servidor.";
        }
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    }
  };

  // Permitir enviar con Enter
  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevenir nueva línea
      handleSendMessage();
    }
  };

  // Exponer funciones al componente padre (GameWindow)
  useImperativeHandle(ref, () => ({
    addMessage: (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    },
    enableChat: () => {
      setMessages([
        "IA: Pregúntame lo que quieras sobre la cuestión actual...",
      ]);
      setInputEnabled(true);
    }, // Mensaje al habilitar
    disableChat: () => {
      setInputEnabled(false);
      setInput("");
      setMessages(["IA: ¿En qué puedo ayudarte?"]);
    }, // Resetear al deshabilitar
  }));

  return (
    // Contenedor principal
    <Paper
      elevation={0} // Sin sombra propia
      sx={{
        width: "100%", // Ocupa ancho del contenedor padre
        height: "100%", // Ocupa alto del contenedor padre
        display: "flex",
        flexDirection: "column",
        p: 1,
        bgcolor: "transparent", // Fondo transparente
        color: PALETTE.lightCyan, // Color de texto por defecto claro
        boxSizing: "border-box",
      }}
    >
      {/* Título del Chat */}
      <Typography
        variant="subtitle1"
        fontWeight="bold"
        sx={{ mb: 1, color: "inherit" }}
      >
        Chat IA
      </Typography>

      {/* Área de Mensajes */}
      <Box
        ref={scrollRef} // Referencia para scroll
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          mb: 1,
          display: "flex",
          flexDirection: "column",
          gap: 0.5, // Gap reducido
          pr: 0.5, // Padding derecho reducido para scrollbar
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": {
            background: PALETTE.federalBlue + "40",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: PALETTE.pacificCyan + "80",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: PALETTE.pacificCyan,
          },
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              // Colores de burbuja según emisor
              bgcolor: msg.startsWith("Tú:")
                ? PALETTE.pacificCyan
                : PALETTE.federalBlue,
              color: msg.startsWith("Tú:")
                ? PALETTE.federalBlue
                : PALETTE.lightCyan,
              p: 1,
              borderRadius: 2,
              fontSize: "0.8rem", // Tamaño fuente ajustado
              alignSelf: msg.startsWith("Tú:") ? "flex-end" : "flex-start", // Alineación
              maxWidth: "90%", // Ancho máximo de burbuja
              wordBreak: "break-word", // Romper palabras largas
              boxShadow: "0 1px 2px rgba(0,0,0,0.2)", // Sombra ligera
            }}
          >
            {msg}
          </Box>
        ))}
      </Box>

      {/* Área de Input */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Escribe aquí..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress} // Enviar con Enter
          fullWidth
          disabled={!inputEnabled}
          sx={{
            // Estilo Input
            "& .MuiInputBase-root": {
              borderRadius: "20px", // Bordes redondeados
              backgroundColor: inputEnabled
                ? PALETTE.federalBlue + "99"
                : PALETTE.federalBlue + "50", // Fondo oscuro semitransparente o más tenue si disabled
            },
            input: { color: PALETTE.lightCyan, fontSize: "0.85rem" }, // Texto claro
            // Estilo Bordes
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: inputEnabled
                  ? PALETTE.pacificCyan
                  : PALETTE.honoluluBlue + "80",
              }, // Borde brillante o tenue
              "&:hover fieldset": {
                borderColor: inputEnabled
                  ? PALETTE.lightCyan
                  : PALETTE.honoluluBlue + "80",
              }, // Borde claro en hover si habilitado
              "&.Mui-focused fieldset": { borderColor: PALETTE.lightCyan }, // Borde claro al enfocar
              "&.Mui-disabled fieldset": {
                borderColor: PALETTE.honoluluBlue + "50",
              }, // Borde muy tenue si disabled
            },
            // Estilo Placeholder
            "& .MuiInputBase-input::placeholder": {
              color: PALETTE.lightCyan + "99", // Placeholder claro semitransparente
              opacity: 1,
            },
            "& .MuiInputBase-input.Mui-disabled::placeholder": {
              color: PALETTE.lightCyan + "50", // Placeholder más tenue si disabled
              opacity: 1,
            },
            "& .MuiInputBase-input.Mui-disabled": {
              WebkitTextFillColor: PALETTE.lightCyan + "70",
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          size="small"
          disabled={!inputEnabled}
          sx={{
            bgcolor: PALETTE.pacificCyan,
            color: PALETTE.federalBlue,
            minWidth: 50,
            px: 1.5,
            borderRadius: "20px",
            "&:hover": { bgcolor: PALETTE.nonPhotoBlue },
            "&.Mui-disabled": {
              bgcolor: PALETTE.federalBlue,
              color: PALETTE.honoluluBlue,
              opacity: 0.7,
            },
          }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
});

export default ChatClues;
