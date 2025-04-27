import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Avatar,
  Box,
  Menu,
  MenuItem,
} from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
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
    federalBlue: "#03045eff", // Más oscuro
    honoluluBlue: "#0077b6ff",
    pacificCyan: "#00b4d8ff",
    nonPhotoBlue: "#90e0efff",
    lightCyan: "#caf0f8ff", // Más claro
  };

  useEffect(() => {
    let currentImageUrl = null;

    if (userId) {
      axios
        .get(`http://localhost:8001/user/${userId}/profile-pic`, {
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
    setProfilePic(null); // Limpiar estado local
    handleMenuClose();
    navigate("/");
  };

  const handleSettings = () => {
    handleMenuClose();
    navigate("/editProfile");
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: colors.federalBlue,
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      }}
    >
      <Toolbar>
        {/* Icono Home */}
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => navigate("/")}
          sx={{
            mr: 1,
            color: colors.lightCyan,
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
          }}
        >
          <HomeIcon />
        </IconButton>

        {/* Título */}
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            color: colors.lightCyan,
            fontWeight: "bold",
          }}
        >
          WIQ - ES6A
        </Typography>

        {/* Botones de navegación */}
        {[
          { label: "Home", path: "/home" },
          { label: "Jugar", path: "/game-options" },
          ...(username ? [{ label: "Stats", path: "/statistics" }] : []),
          { label: "Questions", path: "/questions" },
        ].map((item) => (
          <Button
            key={item.label}
            color="inherit"
            onClick={() => navigate(item.path)}
            sx={{
              color: colors.lightCyan,
              textTransform: "none",
              fontWeight: "500",
              mx: 0.5,
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            {item.label}
          </Button>
        ))}

        {/* Info de Usuario y Menú */}
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
              src={profilePic ? profilePic : "/default-profile-img.jpg"}
              alt={username}
              sx={{
                width: 32,
                height: 32,
                bgcolor: colors.honoluluBlue,
              }}
            />
          </Box>
        ) : (
          // Botón Login si no está logueado
          <Button
            color="inherit"
            onClick={() => navigate("/")}
            sx={{
              color: colors.lightCyan,
              textTransform: "none",
              fontWeight: "500",
              mx: 0.5,
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            Login
          </Button>
        )}

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
            Configuración
          </MenuItem>
          <MenuItem
            onClick={handleLogout}
            sx={{
              "&:hover": { backgroundColor: colors.pacificCyan },
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
