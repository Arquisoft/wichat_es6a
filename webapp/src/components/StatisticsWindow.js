import React, { useState, useEffect, useCallback } from "react";
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import "./AnimatedBackground.css";

const StatisticsWindow = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

  // 🎆 Partículas
  const particleCount = 20;
  const particles = Array.from({ length: particleCount }, (_, index) => ({
    id: index,
    type: index % 2 === 0 ? "star" : "trophy",
    left: Math.random() * 100,
    top: Math.random() * 100,
  }));

  // ✅ Corrección: useCallback para evitar warnings
  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);
    const username = localStorage.getItem("username");

    if (!username) {
      setError("You are not logged in. Please log in to see your statistics.");
      setLoading(false);
      return;
    }

    fetch(apiEndpoint + "/stats", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        username: username,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        console.log("Stats received:", data);
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Error fetching stats: " + err.message);
        setLoading(false);
      });
  }, [apiEndpoint]);

  // ✅ Seguro ahora
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 🎨 Colores por dificultad
  const difficultyColors = {
    Fácil: "#4CAF50",
    Medio: "#FF9800",
    Difícil: "#F44336",
  };

  const showAllGames = () => {
    const username = localStorage.getItem("username");
    if (!username) {
      setError("You are not logged in. Please log in to see your statistics.");
      return;
    }

    setStats((prev) => ({ ...prev, bestGames: [] }));

    fetch(apiEndpoint + "/getAllGames", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        username: username,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        console.log("All games received:", data);
        setStats((prev) => ({ ...prev, bestGames: data }));
        setShowMore(true);
      })
      .catch((err) => {
        console.error("Error fetching all games:", err);
        setError("Error fetching all games: " + err.message);
        setStats((prev) => ({ ...prev, bestGames: [] }));
      });
  };

  const showBestGames = () => {
    const username = localStorage.getItem("username");
    if (!username) {
      setError("No user found. Please log in.");
      return;
    }

    setStats((prev) => ({ ...prev, bestGames: [] }));

    fetch(apiEndpoint + "/getBestGames", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        username: username,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        console.log("Best games received:", data);
        setStats((prev) => ({ ...prev, bestGames: data }));
        setShowMore(false);
      })
      .catch((err) => {
        console.error("Error fetching best games:", err);
        setError("Error fetching best games: " + err.message);
        setStats((prev) => ({ ...prev, bestGames: [] }));
      });
  };

  const handleShowMoreToggle = () => {
    if (!showMore) {
      showAllGames();
    } else {
      showBestGames();
    }
  };

  return (
    <>
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
              {particle.type === "star" ? "⭐" : "🏆"}
            </span>
          ))}
        </div>
      </div>

      <div className="content-wrapper">
        <Container maxWidth="md" sx={{ py: 4 }}>
          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 5 }} />}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

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
                      <IconButton
                        onClick={() => navigate(-1)}
                        color="secondary"
                      >
                        <BackIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3} mb={4}>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center">
                      <GameIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        Games Played: {stats.gamesPlayed || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center">
                      <TrophyIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        Total Points: {stats.totalPoints || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center">
                      <TrophyIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        Points/Game:{" "}
                        {isNaN(stats.pointsPerGame)
                          ? 0
                          : stats.pointsPerGame.toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

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

                <Box>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="h6" gutterBottom>
                      Best Games
                    </Typography>
                    {stats.bestGames && stats.bestGames.length > 0 && (
                      <Tooltip title={showMore ? "Show Less" : "Show More"}>
                        <IconButton
                          onClick={handleShowMoreToggle}
                          color="primary"
                          size="small"
                        >
                          {showMore ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    {stats.bestGames && stats.bestGames.length > 0 ? (
                      stats.bestGames.map((game) => {
                        console.log(
                          "Game ID:",
                          game.id,
                          "Difficulty:",
                          game.difficulty,
                          "Color:",
                          difficultyColors[game.difficulty]
                        );
                        return (
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
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                  >
                                    Game {game.id}
                                  </Typography>
                                </Box>
                                <Typography variant="body2">
                                  Points: {game.points}
                                </Typography>
                                <Typography variant="body2">
                                  Date:{" "}
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
                                    Category: {game.category || "N/A"}
                                  </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" mt={1}>
                                  <TimeIcon
                                    fontSize="small"
                                    color="action"
                                    sx={{ mr: 1 }}
                                  />
                                  <Typography variant="body2">
                                    Time Taken:{" "}
                                    {game.timeTaken
                                      ? `${game.timeTaken} seconds`
                                      : "N/A"}
                                  </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" mt={1}>
                                  <Typography variant="body2">
                                    Difficulty:{" "}
                                  </Typography>
                                  <Chip
                                    label={game.difficulty || "N/A"}
                                    sx={{
                                      ml: 1,
                                      bgcolor:
                                        difficultyColors[game.difficulty] ||
                                        "#757575",
                                      color: "white",
                                      fontSize: "0.75rem",
                                    }}
                                    size="small"
                                  />
                                </Box>
                                <Box mt={1}>
                                  <Chip
                                    label={
                                      game.correctQuestions >=
                                      game.totalQuestions / 2
                                        ? "Win"
                                        : "Loss"
                                    }
                                    color={
                                      game.correctQuestions >=
                                      game.totalQuestions / 2
                                        ? "success"
                                        : "error"
                                    }
                                    size="small"
                                  />
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })
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
