import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from "react";
import { Typography, Button, TextField, Paper, Box } from "@mui/material";
import axios from "axios";

// --- Paleta Azul ---
const PALETTE = {
  federalBlue: "#03045eff",
  honoluluBlue: "#0077b6ff",
  pacificCyan: "#00b4d8ff",
  nonPhotoBlue: "#90e0efff",
  lightCyan: "#caf0efff",
};

const ChatClues = forwardRef(({ actualQuestion, answers }, ref) => {
  const [showChat, setShowChat] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

  // Auto-scroll when chat is visible and messages change
  useEffect(() => {
    if (showChat && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showChat]);

  // Envío de mensaje al servidor
  const handleSendMessage = async () => {
    if (!inputEnabled || input.trim() === "") return;
    const userText = input;
    setMessages((prev) => [...prev, `Tú: ${userText}`]);
    setInput("");
    try {
      const response = await axios.post(`${apiEndpoint}/getHintWithQuery`, {
        question: actualQuestion,
        answers,
        userQuery: userText,
      });
      setMessages((prev) => [...prev, `IA: ${response.data.hint}`]);
    } catch (err) {
      const errorMsg = err.response
        ? `IA: Error del servidor (${err.response.status})`
        : `IA: Sin respuesta del servidor`;
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Métodos expuestos al padre
  useImperativeHandle(ref, () => ({
    addMessage: (msg) => {
      if (!showChat) setShowChat(true);
      setMessages((prev) => [...prev, msg]);
    },
    activateHint: () => {
      setShowChat(true);
      setInputEnabled(false);
    },
    enableChat: () => {
      setShowChat(true);
      setInputEnabled(true);
      setMessages(["IA: Puedes hacer una pregunta sobre la cuestión actual"]);
    },
    disableChat: () => {
      setShowChat(false);
      setInputEnabled(false);
      setInput("");
      setMessages([]);
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
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        Chat IA
      </Typography>

      {/* Vista inicial cuando el chat está inactivo */}
      {!showChat ? (
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Typography variant="body2" align="center">
            Pulsa 'Pista' o 'Pregunta IA' para activar el asistente. Solo con
            'Pregunta IA' puedes escribir tu duda.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Área de Mensajes */}
          <Box
            ref={scrollRef}
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              minHeight: "250px",
              maxHeight: "250px",
              mb: 1,
              px: 1,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            {messages.map((msg, idx) => (
              <Box
                key={idx}
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

          {/* Input y botón de envío */}
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
                  backgroundColor: PALETTE.federalBlue + "99",
                },
                input: { color: PALETTE.lightCyan, fontSize: "0.85rem" },
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
              }}
            >
              Send
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
});

export default ChatClues;
