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

  useEffect(() => {
    if (userId) {
      axios
        .get(`http://localhost:8000/user/${userId}/profile-pic`, {
          responseType: "blob",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((response) => {
          const imageUrl = URL.createObjectURL(response.data);
          setProfilePic(imageUrl);
        })
        .catch((error) => {
          console.error("Error fetching profile picture:", error);
        });
    }
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
    <AppBar position="static" sx={{ backgroundColor: "#1E90FF", boxShadow: 3 }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ padding: 0, textTransform: "none" }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img
                src="/logo512.png"
                alt="WICHAT_ES6A Logo"
                style={{ width: 40, height: 40, marginRight: 8 }}
              />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                WICHAT_ES6A
              </Typography>
            </Box>
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Home">
            <Button
              color="inherit"
              startIcon={<HomeIcon />}
              onClick={() => navigate("/home")}
              sx={{ textTransform: "none", fontWeight: "medium" }}
            >
              Home
            </Button>
          </Tooltip>
          <Tooltip title="Play">
            <Button
              color="inherit"
              startIcon={<PlayArrowIcon />}
              onClick={() => navigate("/game-options")}
              sx={{ textTransform: "none", fontWeight: "medium" }}
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
                sx={{ textTransform: "none", fontWeight: "medium" }}
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
              sx={{ textTransform: "none", fontWeight: "medium" }}
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
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: "6px 12px",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "background-color 0.3s",
                "&:hover": { backgroundColor: "#f0f0f0" },
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: "bold", marginRight: 1 }}
              >
                {username}
              </Typography>
              <Avatar
                src={profilePic || "/default-profile-img.jpg"}
                alt={username}
                sx={{ width: 32, height: 32 }}
              />
            </Box>
          ) : (
            <>
              <Tooltip title="Login">
                <Button
                  color="inherit"
                  startIcon={<LoginIcon />}
                  onClick={handleLogin}
                  sx={{ textTransform: "none", fontWeight: "medium" }}
                >
                  Login
                </Button>
              </Tooltip>
            </>
          )}
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={handleSettings}>
            <SettingsIcon sx={{ mr: 1 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;