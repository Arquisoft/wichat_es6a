import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  LinearProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const StatisticsWindow = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8010/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Error fetching stats: " + err.message);
        setLoading(false);
      });
  }, []);

  return (
    <Container component="main" maxWidth={false} sx={{ width: "100%" }}>
      {/* Eliminamos <Navbar /> porque ya está en App.js */}
      {loading && <LinearProgress sx={{ marginTop: 4 }} />}
      {error && (
        <Alert severity="error" sx={{ marginTop: 4 }}>
          {error}
        </Alert>
      )}
      {!loading && !error && stats && (
        <Paper elevation={3} sx={{ padding: 3, marginTop: 4 }}>
          <Typography variant="h5" align="center">
            Game Statistics
          </Typography>
          <Box sx={{ border: "1px solid gray", padding: 2, marginTop: 2 }}>
            <Typography>Username: {stats.username || "N/A"}</Typography>
            <Typography>Games played: {stats.gamesPlayed || 0}</Typography>
            <Typography>Total points: {stats.totalPoints || 0}</Typography>
            <Typography>
              Points/game:{" "}
              {isNaN(stats.pointsPerGame) ? 0 : stats.pointsPerGame.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ marginTop: 3 }}>
            <Typography>Losses vs Wins</Typography>
            <LinearProgress
              variant="determinate"
              value={(stats.wins / (stats.wins + stats.losses)) * 100 || 0}
              sx={{ height: 10 }}
            />
            <Typography>
              {stats.losses || 0} Losses / {stats.wins || 0} Wins
            </Typography>
          </Box>
          <Box sx={{ marginTop: 3 }}>
            <Typography variant="h6">Best Games:</Typography>
            <Grid container spacing={1}>
              {stats.bestGames && stats.bestGames.length > 0 ? (
                stats.bestGames.map((game) => (
                  <Grid item xs={12} key={game.id}>
                    <Paper sx={{ padding: 1 }}>
                      <Typography>Game {game.id}</Typography>
                      <Typography>Points: {game.points}</Typography>
                      <Typography>
                        Date:{" "}
                        {game.date
                          ? new Date(game.date).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    </Paper>
                  </Grid>
                ))
              ) : (
                <Typography>No best games available</Typography>
              )}
            </Grid>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default StatisticsWindow;
