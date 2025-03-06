import React, { useState } from "react";
import Login from "./Login";
import AddUser from "./AddUser";
import { Container, Typography, Link, CssBaseline } from "@mui/material";

const Auth = () => {
  const [showLogin, setShowLogin] = useState(true);

  const handleToggleView = () => {
    setShowLogin(!showLogin);
  };

  return (
    <>
      <CssBaseline />
      <Container component="main" maxWidth="xs">
        <Typography
          component="h1"
          variant="h5"
          align="center"
          sx={{ marginTop: 2 }}
        >
          Welcome to the 2025 edition of the Software Architecture course
        </Typography>

        {showLogin ? <Login /> : <AddUser />}

        <Typography component="div" align="center" sx={{ marginTop: 2 }}>
          <Link component="button" variant="body2" onClick={handleToggleView}>
            {showLogin
              ? "Don't have an account? Register here."
              : "Already have an account? Login here."}
          </Link>
        </Typography>
      </Container>
    </>
  );
};

export default Auth;
