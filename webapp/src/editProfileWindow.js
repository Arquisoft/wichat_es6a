import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TextField, Button, Box, Avatar, Typography, Paper, Alert, Grid, Divider,
  Card, CardContent, CardActions, Fade, IconButton, Tooltip
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

const EditProfile = () => {
  const navigate = useNavigate();
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [image, setImage] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [loading, setLoading] = useState(true);
  
  const baseURL = "http://localhost:8000/";
  const user_Id = localStorage.getItem("_id");

  useEffect(() => {
    axios.get(baseURL + "user/" + user_Id, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(response => {
        const { username } = response.data;
        setNewUsername(username);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error al cargar los datos del perfil:", error);
        setLoading(false);
      });

    axios.get(baseURL + `user/${user_Id}/profile-pic`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(response => {
        const imageUrl = URL.createObjectURL(response.data);
        setProfilePic(imageUrl);
      })
      .catch(error => console.error("Error al cargar la imagen de perfil:", error));
  }, []);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profilePic", file);
      try {
        await axios.post(baseURL + `user/${user_Id}/profile-pic`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const imageUrl = URL.createObjectURL(file);
        setProfilePic(imageUrl);
        setImage(file);
        window.location.reload();
      } catch (error) {
        console.error("Error al cargar la imagen:", error);
      }
    }
  };

  const handleDeleteImage = async () => {
    try {
      await axios.delete(baseURL + `user/${user_Id}/profile-pic`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setImage(null);
      setProfilePic(null);
      localStorage.removeItem("profilePic");
      window.location.reload();
    } catch (error) {
      console.error("Error al eliminar la imagen:", error);
    }
  };

  const handleSaveUsername = () => {
    if (!newUsername) {
      setUsernameError("El nombre de usuario no puede estar vacío.");
      return;
    }
    axios.put(baseURL + 'user/' + user_Id + '/username', { username: newUsername }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(() => {
        setUsernameError("");
        setPasswordSuccess("Nombre de usuario actualizado con éxito.");
        localStorage.setItem("username", newUsername);
        window.location.reload();
      })
      .catch(error => {
        console.error("Error al guardar el nombre de usuario:", error);
        setUsernameError(error.response?.data?.error || "Error inesperado.");
      });
  };

  const handleSavePassword = () => {
    if (newPassword !== repeatPassword) {
      setPasswordError("Las nuevas contraseñas no coinciden.");
      return;
    }
    if (!currentPassword) {
      setPasswordError("Por favor, ingresa tu contraseña actual.");
      return;
    }
    axios.put(baseURL + 'user/' + user_Id + '/password', {
      currentPassword,
      newPassword,
      confirmPassword: repeatPassword
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(() => {
        setPasswordError("");
        setPasswordSuccess("Contraseña actualizada con éxito.");
      })
      .catch(error => {
        console.error("Error al guardar la contraseña:", error);
        setPasswordError("Error al cambiar la contraseña.");
      });
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.");
    if (!confirmDelete) return;
    axios.delete(baseURL + 'user/' + user_Id, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(() => {
        localStorage.clear();
        navigate("/");
        alert("Tu cuenta ha sido eliminada con éxito.");
      })
      .catch(error => {
        console.error("Error al eliminar el perfil:", error);
        alert("Hubo un problema al eliminar tu cuenta.");
      });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Typography variant="h6" color="white">Cargando perfil...</Typography>
      </Box>
    );
  }

  return (
    <Fade in={!loading}>
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #6b7280 100%)", // Gradiente azul-gris
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Fondo decorativo */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
            zIndex: 0,
          }}
        />

        <Paper
          elevation={10}
          sx={{
            maxWidth: 900, // Más ancho para ocupar más espacio
            width: "90%",
            borderRadius: 4,
            overflow: "hidden",
            bgcolor: "rgba(255, 255, 255, 0.95)", // Fondo blanco semi-transparente
            zIndex: 1,
          }}
        >
          <Box sx={{ bgcolor: "primary.main", p: 4, textAlign: "center" }}>
            <Typography variant="h3" color="white" fontWeight="bold">
              Editar Perfil
            </Typography>
            <Typography variant="subtitle1" color="white" sx={{ opacity: 0.8 }}>
              Personaliza tu cuenta a tu gusto
            </Typography>
          </Box>

          <Box sx={{ p: 6 }}>
            {/* Imagen de Perfil */}
            <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar
                  alt={newUsername}
                  src={profilePic || "/default-profile-img.jpg"}
                  sx={{ width: 150, height: 150, mx: "auto", mb: 3, border: "4px solid #1976d2" }}
                />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  id="profile-pic-input"
                  onChange={handleImageChange}
                />
                <Tooltip title="Cambiar imagen">
                  <IconButton
                    color="primary"
                    onClick={() => document.getElementById("profile-pic-input").click()}
                    size="large"
                  >
                    <PhotoCameraIcon fontSize="large" />
                  </IconButton>
                </Tooltip>
                {profilePic && (
                  <Tooltip title="Eliminar imagen">
                    <IconButton color="error" onClick={handleDeleteImage} size="large">
                      <DeleteIcon fontSize="large" />
                    </IconButton>
                  </Tooltip>
                )}
              </CardContent>
            </Card>

            {/* Nombre de Usuario */}
            <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" color="primary" gutterBottom>
                  Cambiar Nombre de Usuario
                </Typography>
                <TextField
                  label="Nombre de Usuario"
                  fullWidth
                  variant="outlined"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  sx={{ mb: 3 }}
                />
                {usernameError && <Alert severity="error" sx={{ mb: 2 }}>{usernameError}</Alert>}
              </CardContent>
              <CardActions sx={{ px: 3, pb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  fullWidth
                  onClick={handleSaveUsername}
                  size="large"
                >
                  Guardar Nombre
                </Button>
              </CardActions>
            </Card>

            {/* Contraseña */}
            <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" color="primary" gutterBottom>
                  Cambiar Contraseña
                </Typography>
                <TextField
                  label="Contraseña Actual"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  sx={{ mb: 3 }}
                />
                <TextField
                  label="Nueva Contraseña"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{ mb: 3 }}
                />
                <TextField
                  label="Repetir Nueva Contraseña"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  sx={{ mb: 3 }}
                />
                {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
                {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>}
              </CardContent>
              <CardActions sx={{ px: 3, pb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  fullWidth
                  onClick={handleSavePassword}
                  size="large"
                >
                  Guardar Contraseña
                </Button>
              </CardActions>
            </Card>

          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};

export default EditProfile;