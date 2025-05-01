import React from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Divider,
  Chip,
  Avatar,
  LinearProgress
} from "@mui/material";
import {
  EmojiEvents,
  CheckCircle,
  Whatshot,
  Schedule,
  Category,
  Home,
  Replay,
  BarChart,
  Cancel
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

export default function FullScreenScoreWindow() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extraer valores del estado
  const {
    score = 0,
    correctAnswers = 0,
    totalQuestions = 0,
    streak = 0,
    timeTaken = 0,
    category = "General",
    difficulty = "Medio"
  } = location.state || {};

  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const averageTimePerQuestion = totalQuestions > 0 ? (timeTaken / totalQuestions).toFixed(1) : 0;
  const win = correctAnswers >= totalQuestions / 2;

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#ffffff',
      p: 3,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Encabezado */}
      <Box textAlign="center" mt={4} mb={6}>
        <Avatar sx={{
          bgcolor: 'rgba(255,255,255,0.2)',
          width: 100,
          height: 100,
          mx: 'auto',
          mb: 3,
          backdropFilter: 'blur(5px)'
        }}>
          <EmojiEvents sx={{ fontSize: 50 }} />
        </Avatar>
        <Typography variant="h3" fontWeight="bold" gutterBottom data-testid="end-screen-message">
          ¡Partida Finalizada!
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Chip
            label={`Categoría: ${category}`}
            icon={<Category />}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontSize: '1rem',
              py: 1.5
            }}
          />
          <Chip
            label={`Dificultad: ${difficulty}`}
            sx={{ 
              bgcolor: '#FF9800',
              color: '#ffffff',
              fontSize: '1rem',
              py: 1.5
            }}
          />
        </Box>
      </Box>

      {/* Contenido principal */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        maxWidth: '1200px',
        mx: 'auto',
        width: '100%'
      }}>
        {/* Puntuación principal */}
        <Box textAlign="center" mb={6}>
          <Typography variant="h5" sx={{ opacity: 0.8 }}>
            Tu puntuación
          </Typography>
          <Typography variant="h1" fontWeight="bold" sx={{ 
            fontSize: '5rem',
            color: '#fda085',
            textShadow: '0 0 20px rgba(255,255,255,0.3)'
          }}>
            {score}
            <Typography component="span" variant="h3" sx={{ ml: 1 }}>
              pts
            </Typography>
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Columna izquierda - Rendimiento */}
          <Grid item xs={12} md={6}>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              p: 4,
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 3
                }}
              >
                {win ? (
                  <CheckCircle  data-testid = "CheckCircleIcon" sx={{ mr: 2, fontSize: '2rem', color: '#4CAF50' }} />
                ) : (
                  <Cancel  data-testid = "CancelIcon" sx={{ mr: 2, fontSize: '2rem', color: '#F44336' }} />
                )}
                Rendimiento
              </Typography>

              <Box mb={4}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="h6">Precisión:</Typography>
                  <Typography variant="h6" fontWeight="bold">{accuracy}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={accuracy}
                  sx={{ 
                    height: 12,
                    borderRadius: 6,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      backgroundColor: '#4CAF50'
                    }
                  }}
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box sx={{
                    bgcolor: 'rgba(46, 125, 50, 0.3)',
                    p: 3,
                    borderRadius: 3,
                    textAlign: 'center',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: '#4CAF50' }}>
                      {correctAnswers}
                    </Typography>
                    <Typography variant="body1">Correctas</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{
                    bgcolor: 'rgba(211, 47, 47, 0.3)',
                    p: 3,
                    borderRadius: 3,
                    textAlign: 'center',
                    border: '1px solid rgba(244, 67, 54, 0.3)'
                  }}>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: '#F44336' }}>
                      {totalQuestions - correctAnswers}
                    </Typography>
                    <Typography variant="body1">Incorrectas</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Columna derecha - Estadísticas */}
          <Grid item xs={12} md={6}>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              p: 4,
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              height: '100%'
            }}>
              <Typography variant="h5" gutterBottom sx={{ 
                display: 'flex',
                alignItems: 'center',
                mb: 3
              }}>
                Estadísticas
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Whatshot sx={{ mr: 2, fontSize: '2rem', color: '#FF9800' }} />
                  <Box>
                    <Typography variant="body1">Mejor racha</Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {streak}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Schedule sx={{ mr: 2, fontSize: '2rem', color: '#2196F3' }} />
                  <Box>
                    <Typography variant="body1">Tiempo total</Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {timeTaken} seg
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Schedule sx={{ mr: 2, fontSize: '2rem', color: '#2196F3' }} />
                  <Box>
                    <Typography variant="body1">Tiempo por pregunta</Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {averageTimePerQuestion} seg
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Botones de acción */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: 3,
          flexWrap: 'wrap',
          mb: 4
        }}>
          <Button
            variant="contained"
            startIcon={<Replay />}
            onClick={() => navigate("/game-options")}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 50,
              bgcolor: '#ffffff',
              color: '#1976D2',
              '&:hover': {
                bgcolor: '#f5f5f5',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Jugar otra vez
          </Button>
          <Button
            variant="outlined"
            startIcon={<BarChart />}
            onClick={() => navigate("/statistics")}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 50,
              borderColor: 'rgba(255,255,255,0.5)',
              color: '#ffffff',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
                borderColor: '#ffffff'
              }
            }}
          >
            Estadísticas
          </Button>
          <Button
            variant="text"
            startIcon={<Home />}
            onClick={() => navigate("/home")}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 50,
              color: 'rgba(255,255,255,0.8)',
              '&:hover': {
                color: '#ffffff',
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Menú principal
          </Button>
        </Box>
      </Box>
    </Box>
  );
}