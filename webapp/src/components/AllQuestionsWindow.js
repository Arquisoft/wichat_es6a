import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Paper, Grid, CircularProgress } from "@mui/material";

const AllQuestionsWindow = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

useEffect(() => {
  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/questions`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      setError(err.message);
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
            {questions.map((q, index) => (
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
            ))}
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default AllQuestionsWindow;
