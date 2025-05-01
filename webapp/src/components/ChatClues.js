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

const ChatClues = forwardRef(({ actualQuestion, answers }, ref) => { //NOSONAR
  const [messages, setMessages] = useState(["IA: ¿En qué puedo ayudarte?"]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const [inputEnabled, setInputEnabled] = useState(false);


  const handleSendMessage = async () => {
    if (input.trim() !== "" && inputEnabled) {
      const userQuery = input;
      const userMessage = `Tú: ${userQuery}`;
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");
      setInputEnabled(false);
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
        let errorMessage = "IA: Error al obtener la pista. Inténtalo más tarde.";
        if (error.response) {
          errorMessage = `IA: Error del servidor: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = "IA: Sin respuesta del servidor.";
        }
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  useImperativeHandle(ref, () => ({
    addMessage: (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    },
    enableChat: () => {
      setMessages([
        "IA: Pregúntame lo que quieras sobre la cuestión actual...",
      ]);
      setInputEnabled(true);
    },
    disableChat: () => {
      setInputEnabled(false);
      setInput("");
      setMessages(["IA: ¿En qué puedo ayudarte?"]);
    },
  }));

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 1,
        bgcolor: "transparent",
        color: PALETTE.lightCyan,
        boxSizing: "border-box",
      }}
    >
      <Typography
        variant="subtitle1"
        fontWeight="bold"
        sx={{ mb: 1, color: "inherit" }}
      >
        Chat IA
      </Typography>

      {/* Área de Mensajes */}
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          maxHeight: "250px", // Altura máxima añadida
          mb: 1,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          pr: 0.5,
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
              bgcolor: msg.startsWith("Tú:")
                ? PALETTE.pacificCyan
                : PALETTE.federalBlue,
              color: msg.startsWith("Tú:")
                ? PALETTE.federalBlue
                : PALETTE.lightCyan,
              p: 1,
              borderRadius: 2,
              fontSize: "0.8rem",
              alignSelf: msg.startsWith("Tú:") ? "flex-end" : "flex-start",
              maxWidth: "90%",
              wordBreak: "break-word",
              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
            }}
          >
            {msg}
          </Box>
        ))}
      </Box>

      {/* Input */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Escribe aquí..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          fullWidth
          disabled={!inputEnabled}
          sx={{
            "& .MuiInputBase-root": {
              borderRadius: "20px",
              backgroundColor: inputEnabled
                ? PALETTE.federalBlue + "99"
                : PALETTE.federalBlue + "50",
            },
            input: { color: PALETTE.lightCyan, fontSize: "0.85rem" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: inputEnabled
                  ? PALETTE.pacificCyan
                  : PALETTE.honoluluBlue + "80",
              },
              "&:hover fieldset": {
                borderColor: inputEnabled
                  ? PALETTE.lightCyan
                  : PALETTE.honoluluBlue + "80",
              },
              "&.Mui-focused fieldset": { borderColor: PALETTE.lightCyan },
              "&.Mui-disabled fieldset": {
                borderColor: PALETTE.honoluluBlue + "50",
              },
            },
            "& .MuiInputBase-input::placeholder": {
              color: PALETTE.lightCyan + "99",
              opacity: 1,
            },
            "& .MuiInputBase-input.Mui-disabled::placeholder": {
              color: PALETTE.lightCyan + "50",
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
