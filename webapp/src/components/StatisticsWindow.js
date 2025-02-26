import React from "react";
import { Container, Typography, Box, Button, Paper, Grid, LinearProgress } from "@mui/material";
import { Link } from "react-router-dom";

const StatisticsWindow = () => {
  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ padding: 3, marginTop: 4 }}>
        <Typography variant="h5" align="center">Game Statistics</Typography>

        {/* Sección de usuario */}
        <Box sx={{ border: "1px solid gray", padding: 2, marginTop: 2 }}>
          <Typography>Username: Player123</Typography>
          <Typography>DNI: 12345678X</Typography>
          <Typography>Games played: 50</Typography>
          <Typography>Total points: 1500</Typography>
          <Typography>Points/game: 30</Typography>
        </Box>

        {/* Barra de progreso de victorias y derrotas */}
        <Box sx={{ marginTop: 3 }}>
          <Typography>Losses vs Wins</Typography>
          <LinearProgress variant="determinate" value={40} sx={{ height: 10, backgroundColor: "red" }} />
        </Box>

        {/* Mejores partidas */}
        <Box sx={{ marginTop: 3 }}>
          <Typography variant="h6">Best Games:</Typography>
          <Grid container spacing={1}>
            {[1, 2, 3, 4].map((game, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={{ padding: 1 }}>Game {game} - 100 pts - 5 min - 01/01/2025</Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Botón de salir */}
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: 3 }}>
          <Button variant="contained" color="error" component={Link} to="/">
            Exit
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default StatisticsWindow;
