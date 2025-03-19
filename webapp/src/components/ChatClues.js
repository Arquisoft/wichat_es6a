import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Grid, Typography, Button, TextField, Paper, Box } from "@mui/material";
import axios from "axios";

const ChatClues = forwardRef(({ question, answers }, ref) => {
  const [messages, setMessages] = useState(["IA: How can I help you?"]);
  const [input, setInput] = useState("");
  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const apiKey = process.env.LLM_API_KEY;

  const handleSendMessage = async () => {
    if (input.trim() !== "") {
      const userMessage = `You: ${input}`;
      setMessages([...messages, userMessage]);
      setInput("");

      try {
        const response = await axios.post(`${apiEndpoint}/getHintWithQuery`, {
          question: question,
          answers: answers,
          userQuery: input,
          apiKey: apiKey,
        });
        console.log("Peticion lanzada: pregunta " + question);
        console.log("Peticion lanzada: opciones " + answers);
        console.log("Peticion lanzada: query " + input);

        const hintMessage = `IA: ${response.data.hint}`;
        setMessages([...messages, userMessage, hintMessage]);
      } catch (error) {
        console.error("Error getting hint:", error);
        let errorMessage = "IA: Error retrieving hint. Please try again later.";
        if (error.response) {
          console.error(
            "Server responded with:",
            error.response.status,
            error.response.data
          );
          errorMessage = `IA: Server error: ${error.response.status}`;
        } else if (error.request) {
          console.error("No response received:", error.request);
          errorMessage =
            "IA: No response from server. Please check your connection.";
        } else {
          console.error("Error setting up request:", error.message);
        }
        setMessages([...messages, userMessage, errorMessage]);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    addMessage: (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    },
  }));

  return (
    <Grid
      item
      xs={3}
      component={Paper}
      elevation={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        p: 2,
        height: "100vh",
        bgcolor: "#ffffff",
      }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: "bold", color: "#333" }}
      >
        Chat
      </Typography>

      <Grid
        sx={{
          flexGrow: 1,
          border: "1px solid #ddd",
          borderRadius: 2,
          p: 2,
          overflowY: "auto",
          bgcolor: "#fafafa",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              bgcolor: msg.startsWith("You:") ? "#2196F3" : "#E0E0E0",
              color: msg.startsWith("You:") ? "#fff" : "#000",
              p: 1,
              borderRadius: 1,
              maxWidth: "80%",
              alignSelf: msg.startsWith("You:") ? "flex-end" : "flex-start",
            }}
          >
            <Typography variant="body2">{msg}</Typography>
          </Box>
        ))}
      </Grid>

      <Grid container spacing={1} alignItems="center" sx={{ mt: 2 }}>
        <Grid item xs={8}>
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={handleSendMessage}
          >
            Send
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
});

export default ChatClues;
