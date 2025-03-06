import React from "react";
import Grid from "@mui/material/Grid";
import { Typography, Button, TextField, Paper } from "@mui/material";

export function GameWindow() {
  const handleClick = () => {
    console.log("Button pressed.");
  };

  return (
    <Grid container sx={{ height: "100vh", width: "100vw", bgcolor: "#f4f4f4", p: 2 }}>
      {/* Chatbox */}
      <Grid
        item
        xs={3}
        component={Paper}
        elevation={3}
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          p: 2,
          height: "100vh",
          bgcolor: "#ffffff",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#333" }}>
          Chat
        </Typography>

        <Grid
          sx={{
            flexGrow: 1,
            border: "1px solid #ddd",
            borderRadius: 2,
            p: 2,
            overflowY: "auto",
            bgcolor: "#fafafa",
          }}
        >
          {/* Mensajes del Chat */}
          <Typography variant="body2" color="textSecondary">IA: How can I help you?</Typography>
        </Grid>

        {/* Campo de Entrada y Boton Enviar */}
        <Grid container spacing={1} alignItems="center" sx={{ mt: 2 }}>
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
        sx={{ mb: 2 }}>
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
          <Typography variant="h5" fontWeight="bold">Question 1/5</Typography>
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
          <Typography variant="h6" color="primary">Points: 600</Typography>
        </Grid>

        {/* Respuestas */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <Button variant="contained" fullWidth sx={{ borderRadius: 2 }} onClick={handleClick}>
              Answer 1
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="contained" fullWidth sx={{ borderRadius: 2 }} onClick={handleClick}>
              Answer 2
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="contained" fullWidth sx={{ borderRadius: 2 }} onClick={handleClick}>
              Answer 3
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="contained" fullWidth sx={{ borderRadius: 2 }} onClick={handleClick}>
              Answer 4
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
