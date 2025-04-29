import React, { useState } from "react";
import Login from "./Login";
import AddUser from "./AddUser";
import {
  Container,
  Typography,
  Link,
  CssBaseline,
  Box,
  Fade,
} from "@mui/material";

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

        <Box
          sx={{
            marginTop: 2,
            position: "relative",
            minHeight: "450px",
          }}
        >
          <Fade in={showLogin} timeout={400} unmountOnExit>
            <Box sx={{ position: "absolute", width: "100%" }}>
              <Login />
            </Box>
          </Fade>

          <Fade in={!showLogin} timeout={400} unmountOnExit>
            <Box sx={{ position: "absolute", width: "100%" }}>
              <AddUser />
            </Box>
          </Fade>
        </Box>

        <Typography component="div" align="center" sx={{ marginTop: 2 }}>
          {" "}
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
