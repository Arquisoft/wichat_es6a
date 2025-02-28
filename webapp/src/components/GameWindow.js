import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import { Typography, Button } from "@mui/material";
import TextField from "@mui/material/TextField";

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
        p: 5,
        maxWidth: "100%",
        maxHeight: "100%",
        minWidth: 650,
        margin: "auto",
      }}
    >
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
            Hint
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="error" onClick={handleClick}>
            Exit
          </Button>
        </Grid>
      </Grid>

      <Grid
        item
        container
        justifyContent="space-around"
        sx={({ width: "100%" }, { mt: 3 })}
      >
        <Typography>Question 1/5</Typography>
      </Grid>

      {/* Imagen */}
      <Grid
        item
        sx={{
          bgcolor: "whitesmoke",
          width: "50%",
          height: 450,
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
        sx={({ width: "100%" }, { mt: 3 })}
      >
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
            container
            direction="column"
            justifyContent="space-between"
            sx={{
              border: "1px solid black",
              width: "100%",
              height: 150,
              p: 1,
            }}
          >
            {/* Mensajes del Chat (Simulación) */}
            <Typography variant="body2" sx={{ mb: 1 }}>
              IA: How can I help you?
            </Typography>

            {/* Campo de Entrada y Botón Enviar */}
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={8}>
                <TextField
                  variant="outlined"
                  size="small"
                  fullWidth
                  placeholder="Type a message..."
                />
              </Grid>
              <Grid item xs={4}>
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={handleClick}
                >
                  Send
                </Button>
              </Grid>
            </Grid>
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
