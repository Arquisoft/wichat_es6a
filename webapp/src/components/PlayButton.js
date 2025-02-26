import React from 'react';
import Button from '@mui/material/Button';

function PlayButton({ onClick }) {
  return (
    <Button variant="contained" color="secondary" onClick={onClick} fullWidth>
      Jugar
    </Button>
  );
}

export default PlayButton;
