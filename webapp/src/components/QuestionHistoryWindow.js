import React from "react";
import { Container, Typography, Box, Paper, Grid, Button } from "@mui/material";

const QuestionHistoryWindow = () => {
  const user = {
    username: "Player123",
    dni: "12345678X",
  };

  const questions = [
    {
      question: "What is the capital of France?",
      correctAnswer: "Paris",
      isCorrect: true,
    },
    { question: "What is 2 + 2?", correctAnswer: "4", isCorrect: true },
    {
      question: "Who wrote '1984'?",
      correctAnswer: "George Orwell",
      isCorrect: false,
    },
    {
      question: "What is the chemical symbol for water?",
      correctAnswer: "H2O",
      isCorrect: true,
    },
    {
      question: "What is the largest planet in the solar system?",
      correctAnswer: "Jupiter",
      isCorrect: false,
    },
  ];

  const correctAnswers = questions.filter((q) => q.isCorrect).length;
  const incorrectAnswers = questions.length - correctAnswers;

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ padding: 3, marginTop: 4 }}>
        <Typography variant="h5" align="center">
          Question History
        </Typography>

        {/* User Section */}
        <Box sx={{ border: "1px solid gray", padding: 2, marginTop: 2 }}>
          <Typography>Username: {user.username}</Typography>
          <Typography>DNI: {user.dni}</Typography>
          <Typography>Questions answered: {questions.length}</Typography>
          <Typography>Correct answers: {correctAnswers}</Typography>
          <Typography>Incorrect answers: {incorrectAnswers}</Typography>
        </Box>

        {/* Question History */}
        <Box sx={{ marginTop: 3, maxHeight: 300, overflowY: "auto" }}>
          <Typography variant="h6">Answered Questions:</Typography>
          <Grid container spacing={1}>
            {questions.map((q, index) => (
              <Grid item xs={12} key={index}>
                <Paper
                  sx={{
                    padding: 1,
                    backgroundColor: q.isCorrect ? "#d4edda" : "#f8d7da",
                  }}
                >
                  <Typography>
                    <strong>Q:</strong> {q.question}
                  </Typography>
                  <Typography>
                    <strong>Correct Answer:</strong> {q.correctAnswer}
                  </Typography>
                  <Typography>
                    <strong>Result:</strong>{" "}
                    {q.isCorrect ? "Correct ✅" : "Incorrect ❌"}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Back Button */}
        <Box sx={{ marginTop: 3, textAlign: "center" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default QuestionHistoryWindow;
