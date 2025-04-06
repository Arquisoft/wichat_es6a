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
import axios from "axios";  // Asegúrate de tener axios instalado

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("_id");
  const [profilePic, setProfilePic] = useState(null);  // Guardar la imagen del perfil en estado

  useEffect(() => {
    if (userId) {
      // Llamar al endpoint para obtener la imagen de perfil
      axios.get(`http://localhost:8001/user/${userId}/profile-pic`, {
        responseType: 'blob',  // Esperamos una respuesta en formato binario
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      .then(response => {
        // Convertir la respuesta binaria a un URL
        const imageUrl = URL.createObjectURL(response.data);
        setProfilePic(imageUrl);  // Establecer la URL de la imagen en el estado
      })
      .catch(error => {
        console.error("Error al obtener la imagen de perfil:", error);
      });
    }
  }, [userId]);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

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

  return (
    <AppBar position="static" sx={{ backgroundColor: "#1E90FF" }}>
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={() => navigate("/")}>
          <HomeIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Home Page
        </Typography>
        <Button color="inherit" onClick={() => navigate("/home")}>Home</Button>
        <Button color="inherit" onClick={() => navigate("/game-options")}>Jugar</Button>
        <Button color="inherit" onClick={() => navigate("/statistics")}>Stats</Button>
        <Button color="inherit" onClick={() => navigate("/ranking")}>Ranking</Button>

        {username && (
          <Box
            onClick={handleMenuOpen}
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#ffffff",
              color: "#000000",
              padding: "4px 10px",
              borderRadius: "20px",
              marginLeft: 2,
              cursor: "pointer"
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: "bold", marginRight: 2 }}>
              {username}
            </Typography>
            <Avatar
              src={profilePic ? profilePic : "/default-profile-img.jpg"} // Si no hay imagen, usar una por defecto
              alt={username}
              sx={{ width: 32, height: 32 }}
            />
          </Box>
        )}

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleSettings}>Configuración</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
