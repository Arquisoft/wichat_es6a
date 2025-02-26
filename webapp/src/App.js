import Button from '@mui/material/Button';

import React, { useState } from 'react';
import AddUser from './components/AddUser';
import Login from './components/Login';
import StatisticsWindow from "./components/StatisticsWindow";
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [showStatistics, setShowStatistics] = useState(false);

  const handleToggleView = () => {
    setShowLogin(!showLogin);
  };

  const handleToggleStatistics = () => {
    setShowStatistics(!showStatistics);
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Typography component="h1" variant="h5" align="center" sx={{ marginTop: 2 }}>
        Welcome to the 2025 edition of the Software Architecture course
      </Typography>
      
      {showStatistics ? (
        <StatisticsWindow />
      ) : showLogin ? (
        <Login />
      ) : (
        <AddUser />
      )}
      
      <Typography component="div" align="center" sx={{ marginTop: 2 }}>
        {showLogin ? (
          <Link name="gotoregister" component="button" variant="body2" onClick={handleToggleView}>
            Don't have an account? Register here.
          </Link>
        ) : (
          <Link component="button" variant="body2" onClick={handleToggleView}>
            Already have an account? Login here.
          </Link>
        )}
      </Typography>

      <Typography component="div" align="center" sx={{ marginTop: 2 }}>
        <Button variant="text" onClick={handleToggleStatistics}>
          {showStatistics ? "Back to main view" : "Go to Statistics"}
        </Button>

      </Typography>
    </Container>
  );
}

export default App;
