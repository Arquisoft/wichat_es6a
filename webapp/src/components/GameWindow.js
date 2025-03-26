import React, { useEffect, useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import { Typography, Button, Box } from "@mui/material";
import { Whatshot as WhatshotIcon } from "@mui/icons-material";
import ChatClues from "./ChatClues";
import Game from "./Game";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import axios from "axios";
import QuestionTimer from "./QuestionTimer";

export function GameWindow() {
  const navigate = useNavigate();
  const gameRef = useRef(new Game(navigate));
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedbackColors, setFeedbackColors] = useState([]);
  const isInitializedRef = useRef(false);
  const chatCluesRef = useRef(null);
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const apiKey = process.env.GEMINI_API_KEY;

  useEffect(() => {
    const initializeGame = async () => {
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      await gameRef.current.TestingInit();

      setCurrentQuestion(gameRef.current.getCurrentQuestion());
      setPoints(gameRef.current.getCurrentPoints());
      setStreak(gameRef.current.getCurrentStreak());
      gameRef.current.startTimer();
    };

    initializeGame();
  }, []);

  const handleAnswerClick = (index) => {
    if (selectedAnswer !== null) return;

    const correctIndex = currentQuestion.answers.findIndex((ans) => ans.isCorrect);

    setSelectedAnswer(index);

    const newColors = currentQuestion.answers.map((_, i) => {
      if (i === correctIndex) return "#a5d6a7";
      if (i === index && i !== correctIndex) return "#ef9a9a";
      return null;
    });

    setFeedbackColors(newColors);

    setTimeout(() => {
      gameRef.current.answerQuestion(index);
      setCurrentQuestion(gameRef.current.getCurrentQuestion());
      setPoints(gameRef.current.getCurrentPoints());
      setStreak(gameRef.current.getCurrentStreak());
      setSelectedAnswer(null);
      setFeedbackColors([]);
    }, 1500);
  };

  const handleGetHint = async () => {
    if (!currentQuestion || !currentQuestion.answers || currentQuestion.answers.length === 0) {
      chatCluesRef.current.addMessage("IA: No question or answers available to get a hint.");
      return;
    }

    try {
      const response = await axios.post(`${apiEndpoint}/getHint`, {
        question: currentQuestion.questionText,
        answers: currentQuestion.answers.map((answer) => answer.text),
        apiKey: apiKey,
      });

      const hintMessage = `IA: ${response.data.hint}`;
      chatCluesRef.current.addMessage(hintMessage);
    } catch (error) {
      let errorMessage = "IA: Error retrieving hint. Please try again later.";
      if (error.response) errorMessage = `IA: Server error: ${error.response.status}`;
      else if (error.request) errorMessage = "IA: No response from server. Please check your connection.";
      else errorMessage = "IA: Error setting up request.";

      chatCluesRef.current.addMessage(errorMessage);
    }
  };

  return (
    <Box sx={{ bgcolor: "#121212", minHeight: "100vh", p: 0 }}>
      <Navbar />

      <Typography variant="h5" align="center" fontWeight="bold" color="white" sx={{ mb: 3 }}>
        Question {gameRef.current.questionIndex + 1}/{gameRef.current.questions.length}
      </Typography>

      <Grid container justifyContent="center" spacing={3} alignItems="center">
  <Grid item>
    <Box sx={{ width: 250, height: 250 }}>
      <ChatClues
        ref={chatCluesRef}
        question={currentQuestion?.questionText}
        answers={currentQuestion?.answers}
      />
    </Box>
  </Grid>

  <Grid item>
    <Box
      component="img"
      src="/WichatAmigos.png"
      alt="Game"
      sx={{ width: 250, height: 250, borderRadius: 4, boxShadow: 3 }}
    />
  </Grid>

  <Grid item>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <QuestionTimer
        keyProp={currentQuestion?.id || gameRef.current.questionIndex}
        duration={30}
        onComplete={() => {
          if (selectedAnswer !== null) return;

          if (currentQuestion && currentQuestion.answers) {
            const correctIndex = currentQuestion.answers.findIndex((ans) => ans.isCorrect);
            const newColors = currentQuestion.answers.map((_, i) =>
              i === correctIndex ? "#a5d6a7" : "#ef9a9a"
            );
            setFeedbackColors(newColors);
            setSelectedAnswer(correctIndex);

            setTimeout(() => {
              gameRef.current.answerQuestion(correctIndex, true);
              setCurrentQuestion(gameRef.current.getCurrentQuestion());
              setPoints(gameRef.current.getCurrentPoints());
              setStreak(gameRef.current.getCurrentStreak());
              setSelectedAnswer(null);
              setFeedbackColors([]);
            }, 1500);
          } else {
            gameRef.current.answerQuestion(-1, true);
            setCurrentQuestion(gameRef.current.getCurrentQuestion());
          }
          return { shouldRepeat: false };
        }}
      />
      <Button variant="contained" color="primary" onClick={handleGetHint}>
        Hint
      </Button>
    </Box>
  </Grid>
</Grid>


      <Box sx={{ mt: 4, mx: "auto", maxWidth: 800 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" color="white">
            {currentQuestion ? currentQuestion.questionText : "Cargando..."}
          </Typography>
          <Grid item display="flex" alignItems="center">
            <Typography variant="h6" color="#90caf9" sx={{ mr: 1 }}>
              Points: {points}
            </Typography>
            <WhatshotIcon color="error" />
            <Typography variant="h6" color="error" sx={{ ml: 1 }}>
              {streak}
            </Typography>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          {currentQuestion &&
            currentQuestion.answers.map((answer, index) => (
              <Grid item xs={6} key={index}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    bgcolor: feedbackColors[index] || "#1976d2",
                    color: "white",
                    border: selectedAnswer === index ? "3px solid black" : "none",
                    transition: "background-color 0.3s, border 0.3s",
                    "&:disabled": {
                      bgcolor: feedbackColors[index] || "#1976d2",
                      color: "white",
                    },
                  }}
                  onClick={() => handleAnswerClick(index)}
                  disabled={selectedAnswer !== null}
                >
                  {answer.text}
                </Button>
              </Grid>
            ))}
        </Grid>
      </Box>
    </Box>
  );
}

export default GameWindow;
