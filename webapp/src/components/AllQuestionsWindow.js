import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Paper, Grid, CircularProgress } from "@mui/material";

const AllQuestionsWindow = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`http://localhost:8000/questions`);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        setQuestions(data); // Suponiendo que `data` es un array de preguntas
      } catch (err) {
        setError("Error fetching questions: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  if (loading) return <Container><CircularProgress /></Container>;
  if (error) return <Container><Typography color="error">{error}</Typography></Container>;

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ padding: 3, marginTop: 4 }}>
        <Typography variant="h5" align="center">
          All Questions
        </Typography>

        <Box sx={{ marginTop: 3, maxHeight: 400, overflowY: "auto" }}>
          <Grid container spacing={2}>
            {questions.length > 0 ? (
              questions.map((q, index) => (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ padding: 2 }}>
                    <Typography>
                      <strong>Q:</strong> {q.question}
                    </Typography>
                    <Typography>
                      <strong>Correct Answer:</strong> {q.correctAnswer}
                    </Typography>
                    <Typography>
                      <strong>Incorrect Answers:</strong>
                    </Typography>
                    <ul>
                      {q.incorrectAnswers.map((ans, i) => (
                        <li key={i}>{ans}</li>
                      ))}
                    </ul>
                  </Paper>
                </Grid>
              ))
            ) : (
              <Typography>No questions found.</Typography>
            )}
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default AllQuestionsWindow;