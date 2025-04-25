import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from "react";
import { Grid, Typography, Button, TextField, Paper, Box } from "@mui/material";
import axios from "axios";

const ChatClues = forwardRef(({ actualQuestion, answers }, ref) => {
  const [messages, setMessages] = useState(["IA: How can I help you?"]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8003";
  const [inputEnabled, setInputEnabled] = useState(false);

  // Scroll automático al final del chat cada vez que cambian los mensajes
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() !== "") {
      const userQuery = input;
      const userMessage = `You: ${userQuery}`;
      setInput(""); // Limpia el campo de texto
      
      console.log("UQuestion:", actualQuestion);
      try {
        const response = await axios.post(`${apiEndpoint}/getHintWithQuery`, {
          question: actualQuestion,   
          answers: answers,     
          userQuery: userQuery, 
        });

        const hintMessage = `IA: ${response.data.hint}`;
        setMessages((prevMessages) => [
          ...prevMessages,
          userMessage,
          hintMessage,
        ]);
      } catch (error) {
        console.error("Error getting hint:", error);
        let errorMessage = "IA: Error retrieving hint. Please try again later.";
        if (error.response) {
          errorMessage = `IA: Server error: ${error.response.status}`;
        } else if (error.request) {
          errorMessage =
            "IA: No response from server. Please check your connection.";
        }
        setMessages((prevMessages) => [
          ...prevMessages,
          userMessage,
          errorMessage,
        ]);
      }
    }
  };

  // Exponer funciones a componente padre
  useImperativeHandle(ref, () => ({
    addMessage: (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    },
    enableChat: () => {
      setInputEnabled(true);
    },
    disableChat: () => {
      setInputEnabled(false);
      setInput("");
    },
  }));

  return (
    <Paper
      elevation={3}
      sx={{
        width: 250,
        height: 250,
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        p: 2,
        bgcolor: "#1e1e1e",
        color: "#fff",
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        Chat
      </Typography>

      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          mb: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          pr: 1,
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              bgcolor: msg.startsWith("You:") ? "#1976d2" : "#424242",
              color: "#fff",
              p: 1,
              borderRadius: 1,
              fontSize: "0.75rem",
              alignSelf: msg.startsWith("You:") ? "flex-end" : "flex-start",
              maxWidth: "100%",
              wordBreak: "break-word",
            }}
          >
            {msg}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Type..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          fullWidth
          disabled={!inputEnabled}
          sx={{
            input: { color: "#fff" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#555" },
              "&:hover fieldset": { borderColor: "#90caf9" },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          size="small"
          disabled={!inputEnabled}
          sx={{ bgcolor: "#90caf9", color: "#000", minWidth: 60 }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
});

export default ChatClues;
