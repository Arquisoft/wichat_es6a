import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import HistoryButton from './HistoryButton';
import PlayButton from './PlayButton';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="xs" sx={{ marginTop: 4, textAlign: 'center' }}>
      <Typography component="h1" variant="h5">Welcome to Home Page</Typography>
      <HistoryButton />
      <PlayButton />
      <Button variant="contained" color="secondary" sx={{ marginTop: 2 }} onClick={() => navigate('/')}>
        Logout
      </Button>
    </Container>
  );
};

export default Home;
