import React from "react";
import { AppBar, Toolbar, IconButton, Typography, Button } from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={() => navigate("/")}>
          <HomeIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Home Page
        </Typography>
        <Button color="inherit" onClick={() => navigate("/home")}>
          Home
        </Button>
        <Button color="inherit" onClick={() => navigate("/game-options")}>
          Jugar
        </Button>
        <Button color="inherit" onClick={() => navigate("/statistics")}>
          Stats
        </Button>
        <Button color="inherit" onClick={() => navigate("/ranking")}>
          Ranking
        </Button>
        <Button color="inherit" onClick={() => navigate("/")}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
