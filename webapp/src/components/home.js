import React, { useState } from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StatisticsWindow from './StatisticsWindow';

const Home = () => {
  const navigate = useNavigate();
  const [showStatistics, setShowStatistics] = useState(false);

  return (
    <Box
      sx={{
        backgroundImage: 'url("/fondoHome.png")', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 4,                
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Home Page
        </Typography>

        {/* Stack para apilar botones en filas separadas */}
        <Stack direction="column" spacing={2} alignItems="center">
          {!showStatistics && (
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
              }}
              onClick={() => setShowStatistics(true)}
            >
              Show stats
            </Button>
          )}

          {showStatistics && (
            <>
              <StatisticsWindow />
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#d32f2f',
                  '&:hover': {
                    backgroundColor: '#c62828',
                  },
                }}
                onClick={() => setShowStatistics(false)}
              >
                Hide Stats
              </Button>
            </>
          )}

          <Button
            variant="contained"
            sx={{
              backgroundColor: '#9c27b0',
              '&:hover': {
                backgroundColor: '#7b1fa2',
              },
            }}
            onClick={() => navigate('/')}
          >
            Play
          </Button>

          <Button
            variant="contained"
            sx={{
              backgroundColor: '#f57c00',
              '&:hover': {
                backgroundColor: '#ef6c00',
              },
            }}
            onClick={() => navigate('/')}
          >
            Logout
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default Home;
