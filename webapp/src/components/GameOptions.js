import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  Icon,
  keyframes, // Importar keyframes
  Paper, // Usaremos Paper para el contenedor central
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import BalanceIcon from "@mui/icons-material/Balance";
import WarningIcon from "@mui/icons-material/Warning";

// Animación de fondo (sin cambios)
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Keyframes para animación de entrada de botones
const fadeInSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Keyframes para animación de pulso del botón Jugar
const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0px 4px 12px rgba(0,0,0,0.25); }
  50% { transform: scale(1.03); box-shadow: 0px 6px 18px rgba(30, 136, 229, 0.4); }
  100% { transform: scale(1); box-shadow: 0px 4px 12px rgba(0,0,0,0.25); }
`;

const GameOptions = () => {
  const navigate = useNavigate();

  // Datos de dificultades
  const difficulties = [
    {
      name: "Fácil",
      questionCount: 4,
      timePerQuestion: 50,
      color: "#4caf50",
      icon: SentimentSatisfiedAltIcon,
    },
    {
      name: "Medio",
      questionCount: 5,
      timePerQuestion: 30,
      color: "#ff9800",
      icon: BalanceIcon,
    },
    {
      name: "Difícil",
      questionCount: 6,
      timePerQuestion: 15,
      color: "#f44336",
      icon: WarningIcon,
    },
  ];
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulties[1]); // Medio por defecto

  // Datos de categorías
  const categories = [
    { name: "Países", endpoint: "/paises", image: "/paises.png" },
    { name: "Monumentos", endpoint: "/monumentos", image: "/monumentos.jpg" },
    { name: "Elementos", endpoint: "/elementos", image: "/elementos.jpg" },
    { name: "Películas", endpoint: "/peliculas", image: "/peliculas.png" },
    { name: "Canciones", endpoint: "/canciones", image: "/canciones.png" },
    { name: "Fórmula 1", endpoint: "/formula1", image: "/formula1.png" },
    { name: "Pinturas", endpoint: "/pinturas", image: "/pinturas.png" },
    { name: "Variado", endpoint: "/variado", image: "/variado.png" },
  ];
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryButtonClick = (category) => {
    setSelectedCategory(category);
  };

  const handlePlayClick = () => {
    if (selectedCategory && selectedDifficulty) {
      // Create a serializable version of selectedDifficulty without the icon
      const { icon, ...serializableDifficulty } = selectedDifficulty;
      navigate("/game", {
        state: {
          category: selectedCategory,
          difficulty: serializableDifficulty,
        },
      });
    } else {
      alert("Por favor, selecciona una categoría antes de jugar.");
      console.warn("Intento de jugar sin seleccionar categoría.");
    }
  };

  return (
    // Contenedor principal de pantalla completa con fondo animado
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)", // Mismo gradiente que Home
        backgroundSize: "200% 200%",
        animation: `${gradientAnimation} 15s ease infinite`, // Misma animación
        display: "flex",
        alignItems: "center", // Centrar verticalmente el contenido
        justifyContent: "center", // Centrar horizontalmente el contenido
        p: { xs: 2, sm: 3, md: 4 }, // Padding exterior
      }}
    >
      {/* Contenedor central tipo "tarjeta" para las opciones */}
      <Paper
        elevation={8} // Sombra un poco más fuerte
        sx={{
          padding: { xs: 2, sm: 3, md: 4 },
          borderRadius: "20px", // Quizás un poco más redondeado
          // Fondo blanco semi-transparente para destacar sobre el gradiente
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)", // Efecto blur para el fondo
          maxWidth: 1200,
          width: "100%", // Ocupa el ancho disponible hasta maxWidth
          margin: "0 auto", // Centrado por si acaso
          border: "1px solid rgba(255, 255, 255, 0.2)", // Borde blanco sutil
        }}
      >
        <Grid container spacing={4} alignItems="stretch">
          {" "}
          {/* alignItems stretch para igualar altura de columnas */}
          {/* Columna Izquierda: Categorías */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{ display: "flex", flexDirection: "column", height: "100%" }}
            >
              <Typography
                variant="h4" // Tamaño consistente
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "#0b2d45", // Color oscuro consistente
                  mb: 1, // Menos margen inferior
                  textAlign: { xs: "center", md: "left" },
                  fontFamily: "Poppins, sans-serif", // Fuente consistente
                  position: "relative", // Para el pseudo-elemento
                  "&::after": {
                    // Detalle visual bajo el título
                    content: '""',
                    position: "absolute",
                    bottom: "-8px", // Posición bajo el texto
                    left: { xs: "calc(50% - 30px)", md: 0 }, // Centrado en móvil, izquierda en desktop
                    width: "60px",
                    height: "4px",
                    backgroundColor: "#1e88e5", // Color azul primario
                    borderRadius: "2px",
                  },
                }}
              >
                Selecciona una Categoría
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                  },
                  gap: { xs: 2, md: 3 },
                  width: "100%",
                  flexGrow: 1, // Para que ocupe el espacio disponible
                  mt: 4, // Más espacio tras el título
                }}
              >
                {categories.map(
                  (
                    category,
                    index // Añadido index para el delay
                  ) => (
                    <Button
                      key={category.endpoint}
                      onClick={() => handleCategoryButtonClick(category)}
                      sx={{
                        display: "flex", // Necesario para flex props
                        flexDirection: "column", // Apilar imagen y texto
                        alignItems: "center", // Centrar horizontalmente
                        justifyContent: "center", // Centrar verticalmente
                        textAlign: "center", // Centrar texto
                        gap: 1, // Espacio entre imagen y texto
                        backgroundColor: "#ffffff",
                        borderRadius: "16px", // Más redondeado
                        padding: "16px 8px", // Padding uniforme
                        border:
                          selectedCategory?.endpoint === category.endpoint
                            ? "4px solid #007bff" // Borde más grueso y azul más brillante
                            : "4px solid transparent", // Borde transparente para mantener tamaño
                        boxShadow:
                          selectedCategory?.endpoint === category.endpoint
                            ? "0 8px 20px rgba(0, 123, 255, 0.5), 0 0 15px rgba(0, 123, 255, 0.3)" // Sombra + Brillo azul si seleccionado
                            : "0 4px 8px rgba(0, 0, 0, 0.1)", // Sombra normal
                        transform:
                          selectedCategory?.endpoint === category.endpoint
                            ? "scale(1.05)" // Escala un poco más si seleccionado
                            : "scale(1)",
                        transition:
                          "transform 0.3s ease-out, box-shadow 0.3s ease-out, border 0.3s ease-out", // Transición más "elástica"
                        minHeight: { xs: 170, sm: 190 }, // Altura mínima ajustada
                        textTransform: "none", // Evitar mayúsculas automáticas
                        // Animación de entrada con delay
                        opacity: 0, // Empieza invisible
                        animation: `${fadeInSlideUp} 0.5s ease-out forwards`,
                        animationDelay: `${index * 0.08}s`, // Delay escalonado

                        "&:hover": {
                          transform:
                            selectedCategory?.endpoint === category.endpoint
                              ? "scale(1.07)"
                              : "translateY(-5px) scale(1.04)", // Más reacción en hover
                          boxShadow:
                            selectedCategory?.endpoint === category.endpoint
                              ? "0 10px 25px rgba(0, 123, 255, 0.6), 0 0 20px rgba(0, 123, 255, 0.4)" // Brillo/sombra más intensos en hover si seleccionado
                              : "0 8px 16px rgba(0, 0, 0, 0.2), 0 0 10px rgba(0, 0, 0, 0.1)", // Sombra + ligero brillo genérico en hover
                          backgroundColor: "#ffffff", // Mantenemos blanco para que destaque el brillo/sombra
                        },
                        "&:active": { transform: "scale(0.97)" }, // Encoger un poco más al click
                      }}
                    >
                      <Box
                        component="img"
                        src={category.image}
                        alt={`${category.name} icon`}
                        sx={{
                          width: { xs: 70, sm: 90 }, // Tamaños ajustados
                          height: { xs: 70, sm: 90 },
                          objectFit: "contain",
                          borderRadius: "12px", // Redondeo para la imagen interna
                          mb: 1.5,
                        }}
                      />
                      <Typography
                        variant="body1" // Tamaño adecuado para el texto del botón
                        sx={{
                          color: "#1c4966", // Color de texto consistente
                          fontWeight: "600", // Peso de fuente
                          fontFamily: "Poppins, sans-serif", // Fuente consistente
                        }}
                      >
                        {category.name}
                      </Typography>
                    </Button>
                  )
                )}
              </Box>
            </Box>
          </Grid>
          {/* Columna Derecha: Dificultad y Jugar */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-around",
                height: "100%",
                gap: 2,
              }}
            >
              {" "}
              {/* Space Around para distribuir mejor */}
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "#0b2d45",
                  fontFamily: "Poppins, sans-serif",
                  position: "relative", // Para el pseudo-elemento
                  "&::after": {
                    // Detalle visual bajo el título
                    content: '""',
                    position: "absolute",
                    bottom: "-6px",
                    left: "calc(50% - 25px)",
                    width: "50px",
                    height: "3px",
                    backgroundColor: selectedDifficulty.color, // Usa el color de la dificultad!
                    borderRadius: "2px",
                    transition: "background-color 0.3s ease", // Transición del color
                  },
                }}
              >
                Selecciona una Dificultad
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                {difficulties.map((difficulty) => (
                  <Button
                    key={difficulty.name}
                    variant={
                      selectedDifficulty.name === difficulty.name
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => setSelectedDifficulty(difficulty)}
                    sx={{
                      fontWeight: "bold",
                      borderRadius: "10px", // Redondeo
                      borderColor: difficulty.color,
                      color:
                        selectedDifficulty.name === difficulty.name
                          ? "#fff"
                          : difficulty.color,
                      backgroundColor:
                        selectedDifficulty.name === difficulty.name
                          ? difficulty.color
                          : "transparent",
                      boxShadow:
                        selectedDifficulty.name === difficulty.name
                          ? `0 0 10px ${difficulty.color}66`
                          : "none", // Ligero brillo si seleccionado
                      transition: "all 0.3s ease-out", // Transición más elástica
                      "&:hover": {
                        backgroundColor:
                          selectedDifficulty.name !== difficulty.name
                            ? `${difficulty.color}25`
                            : difficulty.color, // Fondo suave al pasar ratón si no seleccionado
                        borderColor: difficulty.color, // Mantener borde
                        transform: "scale(1.05)", // Escalar más
                        boxShadow: `0 0 12px ${difficulty.color}88`, // Brillo más intenso en hover
                      },
                      "&:active": { transform: "scale(0.96)" },
                    }}
                  >
                    {difficulty.name}
                  </Button>
                ))}
              </Box>
              {/* Caja de descripción de dificultad */}
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)", // Fondo blanco ligeramente transparente
                  borderRadius: "16px", // Redondeo consistente
                  padding: "12px 16px",
                  boxShadow: "inset 0 1px 4px rgba(0, 0, 0, 0.1)", // Sombra interior sutil
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center", // Centrar contenido
                  gap: 1.5,
                  width: "100%",
                  maxWidth: 320,
                  border: `3px solid ${selectedDifficulty.color}`, // Borde más grueso que cambia con la dificultad
                  transition:
                    "border-color 0.4s ease, background-color 0.4s ease",
                }}
              >
                <Icon
                  component={selectedDifficulty.icon}
                  sx={{ color: selectedDifficulty.color, fontSize: 28 }}
                />
                <Typography
                  variant="body2" // Tamaño más pequeño para la descripción
                  sx={{
                    color: selectedDifficulty.color,
                    fontWeight: "500",
                    textAlign: "center",
                    fontStyle: "italic",
                    transition: "color 0.4s ease-in-out",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {`${selectedDifficulty.questionCount} preguntas / ${selectedDifficulty.timePerQuestion}s por pregunta`}
                </Typography>
              </Box>
              {/* Botón Jugar */}
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={handlePlayClick}
                disabled={!selectedCategory} // Se deshabilita si no hay categoría
                sx={{
                  fontWeight: "bold",
                  padding: "14px 35px",
                  width: { xs: "90%", sm: "85%" },
                  maxWidth: "300px",
                  borderRadius: "16px",
                  fontFamily: "Poppins, sans-serif",
                  color: "#fff",
                  // Aplicamos el mismo gradiente y efectos que en Home
                  background:
                    "linear-gradient(45deg, #1E90FF 30%, #00BFFF 90%)",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.25)",
                  transition:
                    "transform 0.25s ease-out, background 0.3s ease, box-shadow 0.25s ease-out, opacity 0.3s ease",
                  // Aplicar animación de pulso si NO está deshabilitado
                  animation: !selectedCategory
                    ? "none"
                    : `${pulse} 2s infinite ease-in-out`,

                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #00BFFF 30%, #1E90FF 90%)", // Invertir gradiente en hover
                    transform: "translateY(-3px) scale(1.02)",
                    boxShadow: "0px 8px 18px rgba(0,0,0,0.4)",
                  },
                  "&:active": {
                    transform: "scale(0.97)", // Efecto click
                  },
                  // Estilo para cuando está deshabilitado
                  "&.Mui-disabled": {
                    background: "rgba(0, 0, 0, 0.12)", // Fondo grisáceo estándar
                    color: "rgba(0, 0, 0, 0.26)",
                    boxShadow: "none",
                    cursor: "not-allowed",
                    pointerEvents: "auto",
                    animation: "none", // Detener animación si está deshabilitado
                  },
                }}
              >
                Jugar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default GameOptions;
