import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, TextField, Button, Snackbar } from '@mui/material';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate(); // Hook para redirigir

  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

  const loginUser = async () => {
    try {
      await axios.post(`${apiEndpoint}/login`, { username, password });

      setOpenSnackbar(true);
      setTimeout(() => {
        navigate('/Home'); // Redirigir a /home tras login
      }, 2000);
    } catch (error) {
      setError("Invalid credentials or server error");
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ marginTop: 4 }}>
      <Typography component="h1" variant="h5">Login</Typography>
      <TextField fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button variant="contained" color="primary" onClick={loginUser}>Login</Button>
      <Snackbar open={openSnackbar} autoHideDuration={2000} message="Login successful" />
      {error && <Snackbar open={!!error} autoHideDuration={6000} message={`Error: ${error}`} />}
    </Container>
  );
};

export default Login;
