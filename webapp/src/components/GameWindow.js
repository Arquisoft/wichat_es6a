import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import { Typography, Button } from "@mui/material";

export function GameWindow() {
  const handleClick = () => {
    console.log("Button pressed.");
  };

  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      spacing={2}
      sx={{
        p: 2,
        border: "2px solid black",
        maxWidth: 1000,
        minHeight: 600,
        margin: "auto",
      }}
    >
      {/* Título */}
      <Typography
        variant="h5"
        sx={{
          borderBottom: "2px solid black",
          width: "100%",
          textAlign: "center",
        }}
      >
        GAME WINDOW
      </Typography>

      {/* Botones de Info y Exit */}
      <Grid
        item
        container
        justifyContent="flex-end"
        spacing={1}
        sx={{ width: "100%" }}
      >
        <Grid item>
          <Button variant="contained" color="primary" onClick={handleClick}>
            Info
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="error" onClick={handleClick}>
            Exit
          </Button>
        </Grid>
      </Grid>

      {/* Imagen */}
      <Grid
        item
        sx={{
          bgcolor: "yellow",
          width: "50%",
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: 1,
        }}
      >
        IMAGE
      </Grid>

      {/* Pregunta y Puntuación */}
      <Grid
        item
        container
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
        <Typography>Question 1/5:</Typography>

        {/* Pregunta */}
      <Typography sx={{ mt: 0 }}>
        ¿Question number X----------------------------?
      </Typography>

        <Typography>Points: 600</Typography>
      </Grid>

      

      {/* Contenedor de Chat y Respuestas en la Misma Fila */}
      <Grid container sx={{ mt: 2, width: "100%" }} spacing={2}>
        {/* Cuadro de Chat a la Izquierda */}
        <Grid item xs={3}>
          <Grid
            item
            sx={{
              border: "1px solid black",
              width: "100%",
              height: "100%",
              p: 1,
            }}
          >
            IA help chat
          </Grid>
        </Grid>

        {/* Respuestas a la Derecha */}
        <Grid item xs={7}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button variant="outlined" fullWidth onClick={handleClick}>
                Answer 1
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button variant="outlined" fullWidth onClick={handleClick}>
                Answer 2
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button variant="outlined" fullWidth onClick={handleClick}>
                Answer 3
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button variant="outlined" fullWidth onClick={handleClick}>
                Answer 4
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
