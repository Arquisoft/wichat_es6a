import React, { useState } from "react";
import { Grid, Typography, Button, TextField, Paper, Box } from "@mui/material";
import axios from "axios";

const ChatClues = () => {
  const [messages, setMessages] = useState(["IA: How can I help you?"]);
  const [input, setInput] = useState("");
  const apiEndpoint =
    process.env.REACT_APP_API_ENDPOINT || "http://localhost:8003";
  const apiKey = process.env.LLM_API_KEY;

  const handleSendMessage = async () => {
    if (input.trim() !== "") {
      const userMessage = `You: ${input}`;
      setMessages([...messages, userMessage]);
      setInput("");

      try {
        const response = await axios.post(`${apiEndpoint}/ask`, {
          question: input,
          apiKey: apiKey,
        });

        const iaMessage = `IA: ${response.data.answer}`;
        setMessages([...messages, userMessage, iaMessage]);
      } catch (error) {
        console.error("Error sending message:", error);
        let errorMessage =
          "IA: Error processing your request. Please try again later.";
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error(
            "Server responded with:",
            error.response.status,
            error.response.data
          );
          errorMessage = `IA: Server error: ${error.response.status}`; // You can customize this further
        } else if (error.request) {
          // The request was made but no response was received
          console.error("No response received:", error.request);
          errorMessage =
            "IA: No response from server. Please check your connection.";
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Error setting up request:", error.message);
        }
        setMessages([...messages, userMessage, errorMessage]);
      }
    }
  };

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
};

export default ChatClues;
