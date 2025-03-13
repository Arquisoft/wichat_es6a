import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Paper, Grid, Button, CircularProgress } from "@mui/material";

const QuestionHistoryWindow = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserQuestions = async () => {
      try {
        const response = await fetch("http://localhost:5000/user/questions");
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserQuestions();
  }, []);

  if (loading) return <Container><CircularProgress /></Container>;
  if (error) return <Container><Typography color="error">{error}</Typography></Container>;
  if (!userData) return null;

  const { username, dni, questions, correctAnswers, incorrectAnswers } = userData;

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ padding: 3, marginTop: 4 }}>
        <Typography variant="h5" align="center">
          Question History
        </Typography>

        {/* User Section */}
        <Box sx={{ border: "1px solid gray", padding: 2, marginTop: 2 }}>
          <Typography>Username: {username}</Typography>
          <Typography>DNI: {dni}</Typography>
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
