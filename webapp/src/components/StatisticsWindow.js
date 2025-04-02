import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Alert,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  SportsEsports as GameIcon,
  EmojiEvents as TrophyIcon,
  AccessTime as TimeIcon,
  Category as CategoryIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import './AnimatedBackground.css';

const StatisticsWindow = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Generar partículas (estrellas y trofeos)
  const particleCount = 20; // Número total de partículas
  const particles = Array.from({ length: particleCount }, (_, index) => ({
    id: index,
    type: index % 2 === 0 ? 'star' : 'trophy', // Alternar entre estrellas y trofeos
    left: Math.random() * 100, // Posición inicial aleatoria (0% a 100%)
    top: Math.random() * 100, // Posición inicial aleatoria (0% a 100%)
  }));

  const fetchStats = () => {
    setLoading(true);
    setError(null);
    const username = localStorage.getItem("username");

    if (!username) {
      setError("No user found. Please log in.");
      setLoading(false);
      return;
    }

    fetch("http://localhost:8010/stats", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "username": username,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Error fetching stats: " + err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <>
      {/* Fondo animado con partículas */}
      <div className="background-container">
        <div className="particles">
          {particles.map((particle) => (
            <span
              key={particle.id}
              className={`particle ${particle.type}`}
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
            >
              {particle.type === 'star' ? '⭐' : '🏆'}
            </span>
          ))}
        </div>
      </div>

      {/* Contenedor del contenido */}
      <div className="content-wrapper">
        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* Barra de carga */}
          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 5 }} />}

          {/* Alerta de error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Contenido principal */}
          {!loading && !error && stats && (
            <Card
              elevation={6}
              sx={{
                borderRadius: 3,
                background: "rgba(255, 255, 255, 0.95)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent>
                {/* Encabezado con título y botones */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={3}
                >
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                      <GameIcon />
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      Game Statistics for {stats.username || "N/A"}
                    </Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Refresh Stats">
                      <IconButton onClick={fetchStats} color="primary">
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Back">
                      <IconButton onClick={() => navigate(-1)} color="secondary">
                        <BackIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Estadísticas Generales */}
                <Grid container spacing={3} mb={4}>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center">
                      <GameIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        <strong>Games Played:</strong> {stats.gamesPlayed || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center">
                      <TrophyIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        <strong>Total Points:</strong> {stats.totalPoints || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center">
                      <TrophyIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        <strong>Points/Game:</strong>{" "}
                        {isNaN(stats.pointsPerGame)
                          ? 0
                          : stats.pointsPerGame.toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Victorias vs Derrotas */}
                <Box mb={4}>
                  <Typography variant="h6" gutterBottom>
                    Wins vs Losses
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      stats.wins + stats.losses > 0
                        ? (stats.wins / (stats.wins + stats.losses)) * 100
                        : 0
                    }
                    sx={{
                      height: 12,
                      borderRadius: 5,
                      background: (theme) => {
                        const winPercentage =
                          stats.wins + stats.losses > 0
                            ? (stats.wins / (stats.wins + stats.losses)) * 100
                            : 0;
                        return `linear-gradient(to right, #4caf50 ${winPercentage}%, #f44336 ${winPercentage}%)`;
                      },
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "transparent",
                        borderRadius: 5,
                      },
                    }}
                  />
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    {stats.wins || 0} Wins / {stats.losses || 0} Losses
                  </Typography>
                </Box>

                {/* Mejores Partidas */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Best Games
                  </Typography>
                  <Grid container spacing={2}>
                    {stats.bestGames && stats.bestGames.length > 0 ? (
                      stats.bestGames.map((game) => (
                        <Grid item xs={12} sm={6} md={4} key={game.id}>
                          <Card
                            elevation={2}
                            sx={{
                              borderRadius: 2,
                              transition: "transform 0.2s",
                              "&:hover": { transform: "scale(1.02)" },
                            }}
                          >
                            <CardContent>
                              <Box display="flex" alignItems="center" mb={1}>
                                <TrophyIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="subtitle1" fontWeight="bold">
                                  Game {game.id}
                                </Typography>
                              </Box>
                              <Typography variant="body2">
                                <strong>Points:</strong> {game.points}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Date:</strong>{" "}
                                {game.date
                                  ? new Date(game.date).toLocaleDateString()
                                  : "N/A"}
                              </Typography>
                              <Box display="flex" alignItems="center" mt={1}>
                                <CategoryIcon
                                  fontSize="small"
                                  color="action"
                                  sx={{ mr: 1 }}
                                />
                                <Typography variant="body2">
                                  <strong>Category:</strong>{" "}
                                  {game.category || "N/A"}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" mt={1}>
                                <TimeIcon
                                  fontSize="small"
                                  color="action"
                                  sx={{ mr: 1 }}
                                />
                                <Typography variant="body2">
                                  <strong>Time Taken:</strong>{" "}
                                  {game.timeTaken
                                    ? `${game.timeTaken} seconds`
                                    : "N/A"}
                                </Typography>
                              </Box>
                              <Box mt={1}>
                                <Chip
                                  label={game.points > 50 ? "Win" : "Loss"}
                                  color={game.points > 50 ? "success" : "error"}
                                  size="small"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Typography color="textSecondary">
                          No best games available
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          )}
        </Container>
      </div>
    </>
  );
};

export default StatisticsWindow;