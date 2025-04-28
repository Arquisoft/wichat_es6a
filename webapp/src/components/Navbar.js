import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Home as HomeIcon,
  PlayArrow as PlayArrowIcon,
  BarChart as BarChartIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("_id");
  const [profilePic, setProfilePic] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const colors = {
    federalBlue: "#03045eff",
    honoluluBlue: "#0077b6ff",
    pacificCyan: "#00b4d8ff",
    nonPhotoBlue: "#90e0efff",
    lightCyan: "#caf0f8ff",
  };

  useEffect(() => {
    let currentImageUrl = null;
    if (userId) {
      axios
        .get(`http://localhost:8000/user/${userId}/profile-pic`, {
          responseType: "blob",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((response) => {
          const imageUrl = URL.createObjectURL(response.data);
          currentImageUrl = imageUrl;
          setProfilePic(imageUrl);
        })
        .catch((error) => {
          console.error("Error al obtener la imagen de perfil:", error);
          setProfilePic(null);
        });
    } else {
      setProfilePic(null);
    }

    return () => {
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
      }
    };
  }, [userId]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    localStorage.removeItem("_id");
    setProfilePic(null);
    handleMenuClose();
    navigate("/");
  };

  const handleSettings = () => {
    handleMenuClose();
    navigate("/editProfile");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: colors.federalBlue,
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Logo e Icono */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button
            color="inherit"
            onClick={() => navigate("/home")}
            sx={{ padding: 0, textTransform: "none" }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img
                src="/logo512.png"
                alt="WIQ Logo"
                style={{ width: 40, height: 40, marginRight: 8 }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: colors.lightCyan }}
              >
                WIQ - ES6A
              </Typography>
            </Box>
          </Button>
        </Box>

        {/* Botones navegación */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Home">
            <Button
              color="inherit"
              startIcon={<HomeIcon />}
              onClick={() => navigate("/home")}
              sx={{
                textTransform: "none",
                fontWeight: "medium",
                color: colors.lightCyan,
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
              }}
            >
              Home
            </Button>
          </Tooltip>

          <Tooltip title="Play">
            <Button
              color="inherit"
              startIcon={<PlayArrowIcon />}
              onClick={() => navigate("/game-options")}
              sx={{
                textTransform: "none",
                fontWeight: "medium",
                color: colors.lightCyan,
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
              }}
            >
              Play
            </Button>
          </Tooltip>

          {username && (
            <Tooltip title="Statistics">
              <Button
                color="inherit"
                startIcon={<BarChartIcon />}
                onClick={() => navigate("/statistics")}
                sx={{
                  textTransform: "none",
                  fontWeight: "medium",
                  color: colors.lightCyan,
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                }}
              >
                Stats
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Questions">
            <Button
              color="inherit"
              startIcon={<QuestionAnswerIcon />}
              onClick={() => navigate("/questions")}
              sx={{
                textTransform: "none",
                fontWeight: "medium",
                color: colors.lightCyan,
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
              }}
            >
              Questions
            </Button>
          </Tooltip>

          {username ? (
            <Box
              onClick={handleMenuOpen}
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: colors.honoluluBlue,
                color: colors.federalBlue,
                padding: "4px 8px 4px 12px",
                borderRadius: "20px",
                marginLeft: 2,
                cursor: "pointer",
                transition: "background-color 0.2s ease",
                "&:hover": {
                  backgroundColor: colors.pacificCyan,
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: "bold", marginRight: 1.5 }}
              >
                {username}
              </Typography>
              <Avatar
                src={profilePic || "/default-profile-img.jpg"}
                alt={username}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: colors.honoluluBlue,
                }}
              />
            </Box>
          ) : (
            <Tooltip title="Login">
              <Button
                color="inherit"
                startIcon={<LoginIcon />}
                onClick={handleLogin}
                sx={{
                  textTransform: "none",
                  fontWeight: "medium",
                  color: colors.lightCyan,
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                }}
              >
                Login
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* Menú desplegable */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              backgroundColor: colors.honoluluBlue,
              color: colors.federalBlue,
              borderRadius: "8px",
              mt: 1,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            },
          }}
        >
          <MenuItem
            onClick={handleSettings}
            sx={{
              "&:hover": { backgroundColor: colors.pacificCyan },
            }}
          >
            <SettingsIcon sx={{ mr: 1 }} />
            Configuración
          </MenuItem>
          <MenuItem
            onClick={handleLogout}
            sx={{
              "&:hover": { backgroundColor: colors.pacificCyan },
            }}
          >
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
