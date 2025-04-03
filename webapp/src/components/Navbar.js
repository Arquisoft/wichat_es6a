import React from "react";
import { AppBar, Toolbar, IconButton, Typography, Button, Avatar, Box } from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const profilePic = "webapp/public/profileImg.jpg"; // Static path to profile image

  return (
    <AppBar position="static" sx={{ backgroundColor: "#1976d2" }}>
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
        <Button color="inherit" onClick={() => navigate("/questions")}>Questions</Button>
        <Button color="inherit" onClick={() => { navigate("/"); localStorage.removeItem("username"); }}>
          Logout
        </Button>
        
        {username && (
  <Box 
    sx={{
      display: "flex", 
      alignItems: "center", 
      backgroundColor: "#ffffff",  
      color: "#000000",  
      padding: "4px 10px", 
      borderRadius: "20px", 
      marginLeft: 2
    }}
  >
    <Typography variant="body1" sx={{ fontWeight: "bold", marginRight: 2 }}>
      {username}
    </Typography>
    <Avatar src={profilePic} alt={username} sx={{ width: 32, height: 32 }} />
  </Box>
)}

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
