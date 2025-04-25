import React from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Divider,
  Chip,
  Avatar,
  LinearProgress,
  useTheme
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
  Cancel, 
  Star
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

export default function FullScreenScoreWindow() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

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
  const win = correctAnswers >= totalQuestions/2;

  // Define difficulty colors
  const difficultyColors = {
    Fácil: '#4CAF50', // Green
    Medio: '#FF9800', // Orange
    Difícil: '#F44336' // Red
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: theme.palette.common.white,
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
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          ¡Partida Finalizada!
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Chip
            label={`Categoría: ${category}`}
            color="secondary"
            icon={<Category />}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: '1rem',
              py: 1.5
            }}
          />
          <Chip
            label={`Dificultad: ${difficulty}`}
            sx={{ 
              bgcolor: difficultyColors[difficulty] || 'rgba(255,255,255,0.15)',
              color: 'white',
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
            background: 'linear-gradient(90deg, #f6d365 0%, #fda085 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
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
                  mb: 3,
                }}
              >
                {win ? (
                  <CheckCircle color="success" sx={{ mr: 2, fontSize: '2rem' }} />
                ) : (
                  <Cancel color="error" sx={{ mr: 2, fontSize: '2rem' }} />
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
                    }
                  }}
                  color={accuracy > 70 ? "success" : accuracy > 40 ? "warning" : "error"}
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
                    <Typography variant="h3" fontWeight="bold" color="success.light">
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
                    <Typography variant="h3" fontWeight="bold" color="error.light">
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
                  <Whatshot color="warning" sx={{ mr: 2, fontSize: '2rem' }} />
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
                  <Schedule color="info" sx={{ mr: 2, fontSize: '2rem' }} />
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
                  <Schedule color="info" sx={{ mr: 2, fontSize: '2rem' }} />
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
            color="primary"
            startIcon={<Replay />}
            onClick={() => navigate("/game")}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 50,
              bgcolor: 'rgba(255,255,255,0.9)',
              color: theme.palette.primary.dark,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,1)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Jugar otra vez
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<BarChart />}
            onClick={() => navigate("/statistics")}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 50,
              borderColor: 'rgba(255,255,255,0.5)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
                borderColor: 'white'
              }
            }}
          >
            Estadísticas
          </Button>
          <Button
            variant="text"
            color="inherit"
            startIcon={<Home />}
            onClick={() => navigate("/home")}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 50,
              color: 'rgba(255,255,255,0.8)',
              '&:hover': {
                color: 'white',
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