import React, { useState, useEffect } from "react";
import { Container, Typography, Box, Paper, Grid, LinearProgress } from "@mui/material";

const StatisticsWindow = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Error fetching stats:", err));
  }, []);

  if (!stats) return <Typography>Loading...</Typography>;

  const winPercentage = (stats.wins / (stats.wins + stats.losses)) * 100;

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ padding: 3, marginTop: 4 }}>
        <Typography variant="h5" align="center">Game Statistics</Typography>

        <Box sx={{ border: "1px solid gray", padding: 2, marginTop: 2 }}>
          <Typography>Username: {stats.username}</Typography>
          <Typography>Games played: {stats.gamesPlayed}</Typography>
          <Typography>Total points: {stats.totalPoints}</Typography>
          <Typography>Points/game: {stats.pointsPerGame}</Typography>
        </Box>

        <Box sx={{ marginTop: 3 }}>
          <Typography>Losses vs Wins</Typography>
          <LinearProgress variant="determinate" value={winPercentage} sx={{ height: 10 }} />
          <Typography>{stats.losses} Losses / {stats.wins} Wins</Typography>
        </Box>

        {/* Mejores partidas - Mapeando el array de partidas */}
        <Box sx={{ marginTop: 3 }}>
          <Typography variant="h6">Best Games:</Typography>
          <Grid container spacing={1}>
            {stats.bestGames.map((game) => (
              <Grid item xs={12} key={game.id}>
                <Paper sx={{ padding: 1 }}>
                  <Typography>Game {game.id}</Typography>
                  <Typography>Points: {game.points}</Typography>
                  <Typography>Duration: {game.duration}</Typography>
                  <Typography>Date: {game.date}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default StatisticsWindow;
