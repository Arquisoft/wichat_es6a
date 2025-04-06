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
  const [image, setImage] = useState(null); // Para manejar la imagen cargada
  const [profilePic, setProfilePic] = useState(null); // Para mostrar la imagen cargada
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [usernameError, setUsernameError] = useState(""); 
  const [loading, setLoading] = useState(true);  
  const baseURL = "http://localhost:8001/";

  const user_Id = localStorage.getItem("_id");

  useEffect(() => {
    // Cargar los datos del perfil, incluyendo la imagen de perfil
    axios.get(baseURL + "user/" + user_Id, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(response => {
        const { username } = response.data;
        setNewUsername(username);  // Cargar el nombre de usuario
        setLoading(false);  // Terminar la carga
      })
      .catch(error => {
        console.error("Error al cargar los datos del perfil:", error);
        setLoading(false);
      });

    // Obtener la imagen de perfil directamente
    axios.get(baseURL + `user/${user_Id}/profile-pic`, {
      responseType: 'blob',  // Indicar que esperamos una respuesta binaria
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(response => {
        const imageUrl = URL.createObjectURL(response.data);  // Convertir la respuesta binaria a una URL
        setProfilePic(imageUrl);  // Guardar la URL de la imagen en el estado
      })
      .catch(error => {
        console.error("Error al cargar la imagen de perfil:", error);
      });
  }, []);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profilePic", file); // Enviar el archivo bajo el nombre 'profilePic'
  
      try {
        // Subir la imagen usando el endpoint adecuado
        await axios.post(baseURL + `user/${user_Id}/profile-pic`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // Obtener y mostrar la nueva imagen de perfil
        const imageUrl = URL.createObjectURL(file);  // Convertir el archivo cargado en una URL
        setProfilePic(imageUrl);  // Actualizar la imagen de perfil en el estado
        setImage(file);  // Guardar el archivo de imagen en el estado
      } catch (error) {
        console.error("Error al cargar la imagen:", error);
      }
    }
  };
  

  const handleDeleteImage = async () => {
    try {
      // Llamar al endpoint para eliminar la imagen de perfil
      await axios.delete(baseURL + `user/${user_Id}/profile-pic`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      // Limpiar la imagen en el estado y el localStorage
      setImage(null);
      setProfilePic(null);
      localStorage.removeItem("profilePic");
      window.location.reload()
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
        setUsernameError(""); // Limpiar error si la solicitud es exitosa
        setPasswordSuccess("Nombre de usuario actualizado con éxito.");
        localStorage.setItem("username", newUsername);
        window.location.reload();
      })
      .catch(error => {
        console.error("Error al guardar el nombre de usuario:", error);
        if (error.response && error.response.data && error.response.data.error) {
          setUsernameError(error.response.data.error); 
        } else {
          setUsernameError("Ocurrió un error inesperado al cambiar el nombre de usuario.");
        }
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
        navigate("/");  // Redirigir a la página de inicio
      })
      .catch(error => {
        console.error("Error al eliminar el perfil:", error);
      });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", paddingTop: 20 }}>
        <Typography variant="h6">Cargando...</Typography>
      </Box>
    );
  }

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

          {/* Mostrar avatar de la imagen cargada */}
          <Button onClick={() => document.getElementById("profile-pic-input").click()} sx={{ marginBottom: 2 }}>
            <Avatar 
              alt={newUsername} 
              src={profilePic ? profilePic : "/default-profile-img.jpg"} // Si hay imagen cargada, mostrarla
              sx={{ width: 100, height: 100 }} 
            />
          </Button>

          <input 
            type="file" 
            accept="image/*" 
            style={{ display: "none" }} 
            id="profile-pic-input" 
            onChange={handleImageChange} 
          />

          {/* Mostrar el botón de eliminar si hay imagen cargada */}
          {profilePic && (
            <Box sx={{ marginTop: 2, display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleDeleteImage} 
                sx={{ width: '50%' }}
              >
                Eliminar imagen
              </Button>
            </Box>
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
          {usernameError && <Alert severity="error">{usernameError}</Alert>}
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
