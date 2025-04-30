import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Button,
  Snackbar,
  Box,
} from "@mui/material";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [message, setMessage] = useState("");

  const apiEndpoint = "http://localhost:8000";

  const loginUser = async () => {
    try {
      const response = await axios.post(`${apiEndpoint}/login`, {
        username,
        password,
      });

      console.log(response.data);

      // Almacenar el username en localStorage después de un login exitoso
      localStorage.setItem("username", username);
      localStorage.setItem("_id", response.data.userId);
      localStorage.setItem("token", response.data.token);

      setOpenSnackbar(true);

      setTimeout(() => {
        navigate("/home", { state: { username } });
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        marginTop: 2,
        backgroundColor: "#f4f6f8",
        padding: 4,
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography
        component="h1"
        variant="h5"
        align="center"
        sx={{ marginBottom: 2, fontWeight: "bold" }}
      >
        Login
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <TextField
          margin="normal"
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{
            marginBottom: 1,
            backgroundColor: "#fff",
            borderRadius: 1,
            boxShadow: 1,
          }}
        />
        <TextField
          margin="normal"
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            marginBottom: 2,
            backgroundColor: "#fff",
            borderRadius: 1,
            boxShadow: 1,
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={loginUser}
          sx={{
            marginBottom: 2,
            backgroundColor: "#1976d2",
            "&:hover": { backgroundColor: "#1565c0" },
          }}
        >
          Login
        </Button>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          message="Login successful!"
        />
        {message && (
          <Snackbar
            open={!!message}
            autoHideDuration={6000}
            message={message}
          />
        )}
        {error && (
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            message={`Error: ${error}`}
          />
        )}
      </Box>
    </Container>
  );
};

export default Login;
