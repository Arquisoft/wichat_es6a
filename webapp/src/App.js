import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AddUser from './components/AddUser';
import Login from './components/Login';
import Home from './components/home';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

function App() {
  const [showLogin, setShowLogin] = useState(true);

  const handleToggleView = () => {
    setShowLogin(!showLogin);
  };

  return (
    <Router>
      <CssBaseline />
      <Container component="main" maxWidth="xs">
        <Typography component="h1" variant="h5" align="center" sx={{ marginTop: 2 }}>
          Welcome to the 2025 edition of the Software Architecture course
        </Typography>

        <Routes>
          <Route path="/" element={showLogin ? <Login /> : <AddUser />} />
          <Route path="/Home" element={<Home />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {!showLogin && (
          <Typography component="div" align="center" sx={{ marginTop: 2 }}>
            <Link component="button" variant="body2" onClick={handleToggleView}>
              Already have an account? Login here.
            </Link>
          </Typography>
        )}
      </Container>
    </Router>
  );
}

export default App;
