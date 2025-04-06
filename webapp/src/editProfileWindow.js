import React, { useState, useEffect } from "react";
import axios from "axios";
import { TextField, Button, Box, Avatar, Grid, Typography, Paper, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const navigate = useNavigate();
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [image, setImage] = useState(null);
  const [profilePic, setProfilePic] = useState("/default-profile-img.jpg");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const baseURL = "http://localhost:8001/";

  const user_Id = localStorage.getItem("_id");

  useEffect(() => {
    axios.get(baseURL + "user/" + user_Id, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(response => {
        const { username, _id, profilePic } = response.data;
        setNewUsername(username);
        setProfilePic(profilePic || "/default-profile-img.jpg"); // Set the profile pic if exists
      })
      .catch(error => {
        console.error("Error al cargar los datos del perfil:", error);
      });
  }, []);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = () => {
    if (!image) {
      alert("No has seleccionado ninguna imagen.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePic", image);

    axios.post(baseURL + 'user/' + user_Id + '/profile-pic', formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(() => {
        setPasswordSuccess("Imagen de perfil actualizada con éxito.");
        window.location.reload();
      })
      .catch(error => {
        console.error("Error al guardar la imagen de perfil:", error);
      });
  };

  const handleDeleteImage = () => {
    axios.delete(baseURL + 'user/' + user_Id + '/profile-pic', {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(() => {
        setProfilePic("/default-profile-img.jpg");
        setImage(null);
        setPasswordSuccess("Imagen eliminada con éxito.");
        window.location.reload();
      })
      .catch(error => {
        console.error("Error al eliminar la imagen de perfil:", error);
      });
  };

  const handleSaveUsername = () => {
    if (!newUsername) {
      alert("El nombre de usuario no puede estar vacío");
      return;
    }

    axios.put(baseURL + 'user/' + user_Id + '/username', { username: newUsername }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(() => {
        setPasswordError("");
        setPasswordSuccess("Nombre de usuario actualizado con éxito.");
        localStorage.setItem("username", newUsername);
        window.location.reload();
      })
      .catch(error => {
        console.error("Error al guardar el nombre de usuario:", error);
      });
  };

  const handleSavePassword = () => {
    // Validar que las contraseñas coincidan
    if (newPassword !== repeatPassword) {
      setPasswordError("Las nuevas contraseñas no coinciden.");
      return;
    }
  
    // Validar que la contraseña actual esté escrita
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
          setPasswordError("");  // Limpiar posibles errores
          setPasswordSuccess("Contraseña actualizada con éxito.");
        })
        .catch(error => {
          console.error("Error al guardar la contraseña:", error);
          setPasswordError("Ocurrió un error al cambiar la contraseña.");
        });
  };
  

  const handleDeleteAccount = () => {
    axios.delete(baseURL + 'user/' + user_Id, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(() => {
        localStorage.removeItem("token");
        navigate("/");
      })
      .catch(error => {
        console.error("Error al eliminar el perfil:", error);
      });
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", paddingTop: 20 }}>
      <Paper sx={{ padding: 4, maxWidth: 800, width: "100%" }}>
        <Typography variant="h5" gutterBottom>
          Editar Perfil
        </Typography>

        {/* Sección de Cambio de Imagen de Perfil */}
        <Box sx={{ marginBottom: 4, padding: 2, border: "1px solid #ddd", borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: 250 }}>
          <Typography variant="h6" gutterBottom>
            Cambiar Imagen de Perfil
          </Typography>

          <Button onClick={() => document.getElementById("profile-pic-input").click()} sx={{ marginBottom: 2 }}>
            <Avatar alt={newUsername} src={profilePic} sx={{ width: 100, height: 100 }} />
          </Button>

          <input type="file" accept="image/*" style={{ display: "none" }} id="profile-pic-input" onChange={handleImageChange} />

          {image && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button variant="outlined" color="error" onClick={handleDeleteImage} sx={{ marginTop: 2, width: '48%' }}>
                Eliminar imagen
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveImage} sx={{ marginTop: 2, width: '48%' }}>
                Guardar imagen
              </Button>
            </Box>
          )}

          {!image && profilePic !== "/default-profile-img.jpg" && (
            <Button variant="outlined" color="error" onClick={handleDeleteImage} sx={{ marginTop: 2 }}>
              Eliminar imagen
            </Button>
          )}
        </Box>

        {/* Nombre de Usuario */}
        <Box sx={{ marginBottom: 4, padding: 2, border: "1px solid #ddd", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Cambiar Nombre de Usuario
          </Typography>
          <TextField
            label="Nombre de Usuario"
            fullWidth
            variant="outlined"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <Button variant="contained" color="primary" fullWidth onClick={handleSaveUsername}>
            Cambiar Nombre de Usuario
          </Button>
        </Box>

        {/* Contraseña */}
        <Box sx={{ padding: 2, border: "1px solid #ddd", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Cambiar Contraseña
          </Typography>
          <TextField
            label="Contraseña Actual"
            type="password"
            fullWidth
            variant="outlined"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Nueva Contraseña"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Repetir Nueva Contraseña"
            type="password"
            fullWidth
            variant="outlined"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          {passwordError && <Alert severity="error">{passwordError}</Alert>}
          {passwordSuccess && <Alert severity="success">{passwordSuccess}</Alert>}
          <Button variant="contained" color="primary" fullWidth onClick={handleSavePassword}>
            Cambiar Contraseña
          </Button>
        </Box>

        {/* Eliminar Cuenta */}
        <Grid container spacing={2} sx={{ marginTop: 2 }}>
          <Grid item xs={12}>
            <Button variant="outlined" color="error" fullWidth onClick={handleDeleteAccount}>
              Eliminar Perfil
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default EditProfile;
