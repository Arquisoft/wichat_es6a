import React from "react";
import Grid from "@mui/material/Grid";
import { Typography, Button, Paper } from "@mui/material";
import ChatClues from "./ChatClues";

export function GameWindow() {
  const handleClick = () => {
    console.log("Button pressed.");
  };

  return (
    <Grid container sx={{ bgcolor: "#f4f4f4", p: 2 }}>
      <ChatClues />

      {/* Contenedor Principal */}
      <Grid item xs={9} container direction="column" sx={{ p: 3, mx: "auto" }}>
        {/* Botones de Info y Exit */}
        <Grid
          item
          container
          justifyContent="flex-end"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Grid item>
            <Button variant="contained" color="primary" onClick={handleClick}>
              Hint
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="error" onClick={handleClick}>
              Exit
            </Button>
          </Grid>
        </Grid>

        {/* Pregunta */}
        <Grid item sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Question 1/5
          </Typography>
        </Grid>

        {/* Imagen */}
        <Grid
          item
          component={Paper}
          elevation={3}
          sx={{
            bgcolor: "#ffffff",
            width: "50%",
            height: 450,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
            mx: "auto",
            mb: 2,
          }}
        >
          IMAGE
        </Grid>

        {/* Pregunta y Puntuacion */}
        <Grid item container justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">¿Question number X?</Typography>
          <Typography variant="h6" color="primary">
            Points: 600
          </Typography>
        </Grid>

        {/* Respuestas */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <Button
              variant="contained"
              fullWidth
              sx={{ borderRadius: 2 }}
              onClick={handleClick}
            >
              Answer 1
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              fullWidth
              sx={{ borderRadius: 2 }}
              onClick={handleClick}
            >
              Answer 2
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              fullWidth
              sx={{ borderRadius: 2 }}
              onClick={handleClick}
            >
              Answer 3
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              fullWidth
              sx={{ borderRadius: 2 }}
              onClick={handleClick}
            >
              Answer 4
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
export default GameWindow;
