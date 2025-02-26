import React from 'react';
import Button from '@mui/material/Button';

function HistoryButton({ onClick }) {
  return (
    <Button variant="contained" color="primary" onClick={onClick} fullWidth>
      Ver Historial
    </Button>
  );
}

export default HistoryButton;
