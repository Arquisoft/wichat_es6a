import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import { Typography, Button, TextField } from "@mui/material";

export function GameWindow() {
  const handleClick = () => {
    console.log("Button pressed.");
  };

  return (
    <Grid container sx={{ height: "100vh", width: "100vw" }}>
      {/* Chatbox */}
      <Grid
        item
        xs={3}
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid black",
          p: 2,
          height: "100vh",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Chat
        </Typography>

        <Grid
          sx={{
            flexGrow: 1,
            border: "1px solid black",
            p: 1,
            overflowY: "auto",
          }}
        >
          {/* Mensajes del Chat */}
          <Typography variant="body2">IA: How can I help you?</Typography>
        </Grid>

        {/* Campo de Entrada y Boton Enviar */}
        <Grid container spacing={1} alignItems="center" sx={{ mt: 1 }}>
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

      {/* Contenedor Principal */}
      <Grid item xs={9} container direction="column" sx={{ p: 3 }}>
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
            mx: "auto",
            mb: 2,
          }}
        >
          IMAGE
        </Grid>

        {/* Pregunta y Puntuacion */}
        <Grid item container justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography>
            ¿Question number X----------------------------?
          </Typography>
          <Typography>Points: 600</Typography>
        </Grid>

        {/* Respuestas */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
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
  );
}
