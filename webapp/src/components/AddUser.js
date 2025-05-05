import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Button,
  Snackbar,
  Box,
} from "@mui/material";

const apiEndpoint =
  process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

const AddUser = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const addUser = async () => {
    try {
      await axios.post(`${apiEndpoint}/adduser`, { username, password });
      setOpenSnackbar(true);
    } catch (error) {
      setError(error.response.data.error);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
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
        Add User
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <TextField
          name="username"
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
          name="password"
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
          onClick={addUser}
          sx={{
            marginBottom: 2,
            backgroundColor: "#1976d2",
            "&:hover": { backgroundColor: "#1565c0" },
          }}
        >
          Add User
        </Button>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message="User added successfully"
        />
        {error && (
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError("")}
            message={`Error: ${error}`}
          />
        )}
      </Box>
    </Container>
  );
};

export default AddUser;
