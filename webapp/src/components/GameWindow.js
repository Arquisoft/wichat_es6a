import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import { Typography, Button } from '@mui/material';

export function GameWindow() {

  const handleClick = () => {
    console.log("Button pressed.");
  };

  return (
    <Grid container direction="column" alignItems="center" spacing={2} sx={{ p: 2, border: '2px solid black', maxWidth: 600, margin: 'auto' }}>
      {/* Título */}
      <Typography variant="h5" sx={{ borderBottom: '2px solid black', width: '100%', textAlign: 'center' }}>GAME WINDOW</Typography>
      
      {/* Imagen */}
      <Grid item sx={{ bgcolor: 'yellow', width: '100%', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 1 }}>IMAGE</Grid>
      
      {/* Botones de Info y Exit */}
      <Grid item container justifyContent="flex-start" spacing={1} sx={{ width: '100%' }}>
        <Grid item>
          <Button variant="contained" color="error"  onClick={handleClick}>Exit</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary"  onClick={handleClick}>Info</Button>
        </Grid>
      </Grid>
      
      {/* Pregunta y Puntuación */}
      <Grid item container justifyContent="space-between" sx={{ width: '100%' }}>
        <Typography>Question 1/5:</Typography>
        <Typography>Points: 600</Typography>
      </Grid>
      
      {/* Pregunta */}
      <Typography sx={{ mt: 2 }}>¿Question number X----------------------------?</Typography>
      
      {/* Respuestas */}
      <Grid item container spacing={1} sx={{ mt: 2 }}>
        <Grid item xs={6}><Button variant="outlined" fullWidth  onClick={handleClick}>Answer 1</Button></Grid>
        <Grid item xs={6}><Button variant="outlined" fullWidth  onClick={handleClick}>Answer 2</Button></Grid>
        <Grid item xs={6}><Button variant="outlined" fullWidth  onClick={handleClick}>Answer 3</Button></Grid>
        <Grid item xs={6}><Button variant="outlined" fullWidth  onClick={handleClick}>Answer 4</Button></Grid>
      </Grid>
      
      {/* Chat de ayuda IA */}
      <Grid item sx={{ border: 1, width: '100%', height: 100, p: 1 }}>IA help chat</Grid>
    </Grid>
  );
  
}
