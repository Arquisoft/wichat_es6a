// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // ✅ Importamos useNavigate
import axios from 'axios';
import { Container, Typography, TextField, Button, Snackbar } from '@mui/material';

const Login = () => {
  const navigate = useNavigate(); // ✅ Hook para la navegación
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
  const apiKey = process.env.REACT_APP_LLM_API_KEY || 'None';

  const loginUser = async () => {
    try {
      const response = await axios.post(`${apiEndpoint}/login`, { username, password });

      const question = `Please, generate a greeting message for a student called ${username} that is a student of the Software Architecture course in the University of Oviedo. Be nice and polite. Two to three sentences max.`;
      const model = "empathy";

      if (apiKey === 'None') {
        setMessage("LLM API key is not set. Cannot contact the LLM.");
      } else {
        const messageResponse = await axios.post(`${apiEndpoint}/askllm`, { question, model, apiKey });
        setMessage(messageResponse.data.answer);
      }

      setCreatedAt(response.data.createdAt);
      setOpenSnackbar(true);

      setTimeout(() => {
        navigate('/home'); 
      }, 2000); 

    } catch (error) {
      setError(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ marginTop: 4 }}>
      <Typography component="h1" variant="h5">
        Login
      </Typography>
      <TextField
        margin="normal"
        fullWidth
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        margin="normal"
        fullWidth
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={loginUser}>
        Login
      </Button>
      <Snackbar open={openSnackbar} autoHideDuration={6000} message="Login successful!" />
      {error && <Snackbar open={!!error} autoHideDuration={6000} message={`Error: ${error}`} />}
    </Container>
  );
};

export default Login;
