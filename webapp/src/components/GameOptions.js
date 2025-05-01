// src/components/GameOptions.js
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

// --- Paleta Azul ---
// Paleta de colores principal utilizada en la aplicación.
const PALETTE = {
  federalBlue: "#03045eff", // Azul muy oscuro, para texto principal sobre fondos claros
  honoluluBlue: "#0077b6ff", // Azul medio, para acentos, fondos secundarios, bordes
  pacificCyan: "#00b4d8ff", // Azul brillante, para hovers, selecciones activas, brillos
  nonPhotoBlue: "#90e0efff", // Azul claro
  lightCyan: "#caf0f8ff", // Azul muy claro, para texto sobre fondos oscuros
};

// --- Animaciones Keyframes ---

// Animación para el fondo degradado
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Animación para la entrada de elementos (fade in + slide up)
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

// Animación de pulso para el botón "Jugar", usando un color de la paleta azul
const pulse = (
  shadowColor = `rgba(0, 180, 216, 0.4)`
) => keyframes` // Usa pacificCyan con opacidad
  0% { transform: scale(1); box-shadow: 0px 4px 12px rgba(0,0,0,0.2); } /* Sombra base oscura */
  50% { transform: scale(1.03); box-shadow: 0px 6px 18px ${shadowColor}; } /* Sombra de color */
  100% { transform: scale(1); box-shadow: 0px 4px 12px rgba(0,0,0,0.2); }
`;

// --- Componente Principal ---

const GameOptions = () => {
  const navigate = useNavigate();

  // --- Datos de Dificultades ---
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
  // Estado para la dificultad seleccionada, por defecto "Medio"
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulties[1]);

  // --- Datos de Categorías ---
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
  // Estado para la categoría seleccionada
  const [selectedCategory, setSelectedCategory] = useState(null);

  // --- Handlers ---

  // Manejador para seleccionar una categoría
  const handleCategoryButtonClick = (category) => {
    setSelectedCategory(category);
  };

  // Manejador para iniciar el juego
  const handlePlayClick = () => {
    if (selectedCategory && selectedDifficulty) {
      // Quitamos propiedades no serializables (icono, color) antes de navegar
      const { icon, color, ...serializableDifficulty } = selectedDifficulty;
      navigate("/game", {
        state: {
          category: selectedCategory,
          difficulty: serializableDifficulty, // Pasamos solo los datos necesarios
        },
      });
    } else {
      // Alerta simple si no se selecciona categoría (se podría mejorar con un Snackbar)
      alert("Por favor, selecciona una categoría antes de jugar.");
    }
  };

  // Generar la animación de pulso para el botón Jugar
  const pulseAnimation = pulse(`rgba(0, 180, 216, 0.4)`); // Sombra pacificCyan

  // --- Renderizado ---
  return (
    // Contenedor principal con el fondo degradado solicitado
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)", // Ajustar altura si hay AppBar
        // Fondo degradado de AllQuestionsWindow aplicado aquí
        background: "linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)",
        backgroundSize: "200% 200%",
        animation: `${gradientAnimation} 15s ease infinite`, // Duración consistente
        display: "flex",
        alignItems: "center", // Centrar verticalmente el Paper
        justifyContent: "center", // Centrar horizontalmente el Paper
        p: { xs: 2, sm: 3, md: 4 }, // Padding responsivo
        boxSizing: "border-box",
      }}
    >
      {/* Contenedor central tipo "tarjeta" con efecto translúcido */}
      <Paper
        elevation={8} // Sombra pronunciada
        sx={{
          padding: { xs: 2, sm: 3, md: 4 },
          borderRadius: "20px", // Bordes redondeados
          backgroundColor: "rgba(255, 255, 255, 0.9)", // Fondo blanco translúcido
          backdropFilter: "blur(10px)", // Efecto de desenfoque del fondo
          maxWidth: 1200, // Ancho máximo del contenido
          width: "100%", // Ocupa el ancho disponible
          margin: "0 auto", // Centrado horizontal
          border: "1px solid rgba(255, 255, 255, 0.2)", // Borde sutil para definir
        }}
      >
        {/* Grid principal para dividir en dos columnas */}
        <Grid container spacing={4} alignItems="stretch">
          {" "}
          {/* Columna Izquierda: Selección de Categorías */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{ display: "flex", flexDirection: "column", height: "100%" }}
            >
              {/* Título de la sección Categorías */}
              <Typography
                variant="h4"
                gutterBottom // Margen inferior
                sx={{
                  fontWeight: "bold",
                  color: PALETTE.federalBlue, // Texto oscuro de la paleta
                  mb: 1,
                  textAlign: { xs: "center", md: "left" }, // Centrado en móvil, izquierda en desktop
                  fontFamily: "Poppins, sans-serif", // Fuente opcional
                  position: "relative", // Para la línea decorativa
                  "&::after": {
                    // Línea decorativa azul medio
                    content: '""',
                    position: "absolute",
                    bottom: "-8px",
                    left: { xs: "calc(50% - 30px)", md: 0 },
                    width: "60px",
                    height: "4px",
                    backgroundColor: PALETTE.honoluluBlue,
                    borderRadius: "2px",
                  },
                }}
              >
                Selecciona una Categoría
              </Typography>

              {/* Grid para los botones de categoría */}
              <Box
                sx={{
                  display: "grid",
                  // Columnas responsivas
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                  },
                  gap: { xs: 2, md: 3 }, // Espaciado responsivo
                  width: "100%",
                  flexGrow: 1, // Ocupa el espacio vertical disponible
                  mt: 4, // Margen superior
                }}
              >
                {/* Mapeo de las categorías para crear los botones */}
                {categories.map((category, index) => (
                  <Button
                    key={category.endpoint}
                    onClick={() => handleCategoryButtonClick(category)}
                    data-testid={
                      category.name === "Variado"
                        ? "category-mixed"
                        : "category-select"
                    }
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      gap: 1,
                      background: `linear-gradient(135deg, ${PALETTE.lightCyan} 0%, ${PALETTE.nonPhotoBlue} 100%)`,
                      borderRadius: "16px",
                      padding: "16px 8px",
                      border:
                        selectedCategory?.endpoint === category.endpoint
                          ? `4px solid ${PALETTE.pacificCyan}`
                          : "4px solid transparent", // Borde transparente si no está seleccionado
                      boxShadow:
                        selectedCategory?.endpoint === category.endpoint
                          ? `0 8px 20px rgba(0, 180, 216, 0.5), 0 0 15px rgba(0, 180, 216, 0.3)` // Sombra pacificCyan
                          : "0 4px 8px rgba(0, 0, 0, 0.1)", // Sombra normal más sutil por defecto
                      transform:
                        selectedCategory?.endpoint === category.endpoint
                          ? "scale(1.05)" // Ligero aumento si seleccionado
                          : "scale(1)", // Tamaño normal
                      transition:
                        "transform 0.3s ease-out, box-shadow 0.3s ease-out, border 0.3s ease-out, background 0.3s ease-out",
                      minHeight: { xs: 170, sm: 190 }, // Altura mínima
                      textTransform: "none", // Evitar mayúsculas
                      // Animación de entrada
                      opacity: 0,
                      animation: `${fadeInSlideUp} 0.5s ease-out forwards`,
                      animationDelay: `${index * 0.08}s`,
                      "&:hover": {
                        transform:
                          selectedCategory?.endpoint === category.endpoint
                            ? "scale(1.07)" // Aumento mayor en hover si está seleccionado
                            : "translateY(-5px) scale(1.04)", // Levitar y aumentar si no seleccionado
                        boxShadow:
                          selectedCategory?.endpoint === category.endpoint
                            ? `0 10px 25px rgba(0, 180, 216, 0.6), 0 0 20px rgba(0, 180, 216, 0.4)` // Más intensa si seleccionado
                            : `0 8px 16px rgba(0, 180, 216, 0.3), 0 0 10px rgba(0, 180, 216, 0.1)`, // Sombra pacificCyan si no seleccionado
                      },
                      "&:active": { transform: "scale(0.97)" }, // Efecto click
                    }}
                  >
                    {/* Imagen de la categoría */}
                    <Box
                      component="img"
                      src={category.image}
                      alt={`${category.name} icon`}
                      sx={{
                        width: { xs: 70, sm: 90 },
                        height: { xs: 70, sm: 90 },
                        objectFit: "contain",
                        borderRadius: "12px",
                        mb: 1.5,
                      }}
                    />
                    {/* Nombre de la categoría */}
                    <Typography
                      variant="body1"
                      sx={{
                        color: PALETTE.federalBlue, // Texto oscuro para contraste
                        fontWeight: "600",
                        fontFamily: "Poppins, sans-serif",
                      }}
                    >
                      {category.name}
                    </Typography>
                  </Button>
                ))}
              </Box>
            </Box>
          </Grid>
          {/* Columna Derecha: Selección de Dificultad y Botón Jugar */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-around", // Mejor distribución vertical
                height: "100%",
                gap: { xs: 3, md: 2 }, // Ajuste del espacio entre elementos
              }}
            >
              {/* Título de la sección Dificultad */}
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: PALETTE.federalBlue,
                  fontFamily: "Poppins, sans-serif",
                  position: "relative",
                  textAlign: "center", // Asegurar centrado del título
                  mb: { xs: 1, md: 0 }, // Margen inferior ajustado
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: "-6px",
                    left: "calc(50% - 25px)", // Centrado bajo el texto
                    width: "50px",
                    height: "3px",
                    backgroundColor: selectedDifficulty.color, // Color semántico
                    borderRadius: "2px",
                    transition: "background-color 0.3s ease",
                  },
                }}
              >
                Selecciona una Dificultad
              </Typography>

              {/* Botones de dificultad  */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 1.5,
                  flexWrap: "wrap", // Permite que los botones pasen a la siguiente línea si no caben
                  width: "100%", // Asegurar que ocupa el ancho para centrar bien
                  mt: { xs: 1, md: 0 }, // Margen superior ajustado
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
                    data-testid={`difficulty-${difficulty.name.toLowerCase()}`}
                    sx={{
                      // Estilos basados en el color semántico de la dificultad
                      fontWeight: "bold",
                      borderRadius: "10px",
                      px: 2.5, // Padding horizontal
                      py: 0.8, // Padding vertical
                      borderColor: difficulty.color,
                      color:
                        selectedDifficulty.name === difficulty.name
                          ? "#fff" // Texto blanco si seleccionado
                          : difficulty.color, // Texto de color si no seleccionado
                      backgroundColor:
                        selectedDifficulty.name === difficulty.name
                          ? difficulty.color // Fondo de color si seleccionado
                          : "transparent", // Fondo transparente si no seleccionado
                      boxShadow:
                        selectedDifficulty.name === difficulty.name
                          ? `0 0 10px ${difficulty.color}66` // Sombra suave si seleccionado
                          : "none", // Sin sombra si no seleccionado
                      transition: "all 0.3s ease-out",
                      "&:hover": {
                        backgroundColor:
                          selectedDifficulty.name !== difficulty.name
                            ? `${difficulty.color}25` // Fondo muy claro en hover si no seleccionado
                            : difficulty.color, // Mantiene color de fondo si seleccionado
                        borderColor: difficulty.color, // Mantiene borde
                        transform: "scale(1.05)", // Ligero aumento en hover
                        boxShadow: `0 0 12px ${difficulty.color}88`, // Sombra más visible en hover
                      },
                      "&:active": { transform: "scale(0.96)" }, // Efecto click
                    }}
                  >
                    {difficulty.name}
                  </Button>
                ))}
              </Box>

              {/* Caja de descripción de la dificultad */}
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)", // Fondo ligeramente translúcido
                  borderRadius: "16px",
                  padding: "12px 16px",
                  boxShadow: "inset 0 1px 4px rgba(0, 0, 0, 0.1)", // Sombra interior sutil
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  width: "100%", // Ocupar ancho disponible
                  maxWidth: 320, // Ancho máximo
                  border: `3px solid ${selectedDifficulty.color}`, // Borde con color semántico
                  transition:
                    "border-color 0.4s ease, background-color 0.4s ease", // Transición suave
                  mt: { xs: 1, md: 0 }, // Margen superior ajustado
                }}
              >
                <Icon
                  component={selectedDifficulty.icon}
                  sx={{ color: selectedDifficulty.color, fontSize: 28 }} // Icono con color semántico
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: selectedDifficulty.color, // Texto con color semántico
                    fontWeight: "500",
                    textAlign: "center",
                    fontStyle: "italic", // Estilo itálico
                    transition: "color 0.4s ease-in-out",
                    fontFamily: "Poppins, sans-serif", // Fuente consistente
                  }}
                >
                  {`${selectedDifficulty.questionCount} preguntas / ${selectedDifficulty.timePerQuestion}s por pregunta`}
                </Typography>
              </Box>

              {/* Botón Jugar */}
              <Button
                variant="contained"
                size="large"
                data-testid="start-game-button"
                startIcon={<PlayArrowIcon />}
                onClick={handlePlayClick}
                disabled={!selectedCategory} // Deshabilitado si no hay categoría
                sx={{
                  fontWeight: "bold",
                  padding: "14px 35px", // Padding generoso
                  width: { xs: "90%", sm: "85%" }, // Ancho responsivo
                  maxWidth: "300px", // Ancho máximo
                  borderRadius: "16px", // Bordes redondeados consistentes
                  fontFamily: "Poppins, sans-serif", // Fuente consistente
                  color: PALETTE.lightCyan, // Texto claro
                  // Gradiente azul principal
                  background: `linear-gradient(45deg, ${PALETTE.honoluluBlue} 30%, ${PALETTE.pacificCyan} 90%)`,
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.25)", // Sombra base
                  transition:
                    "transform 0.25s ease-out, background 0.3s ease, box-shadow 0.25s ease-out, opacity 0.3s ease", // Transiciones suaves
                  // Animación de pulso si está habilitado
                  animation: !selectedCategory
                    ? "none" // Sin animación si deshabilitado
                    : `${pulseAnimation} 2s infinite ease-in-out`,
                  mt: { xs: 2, md: 1 },
                  "&:hover": {
                    background: `linear-gradient(45deg, ${PALETTE.pacificCyan} 30%, ${PALETTE.honoluluBlue} 90%)`,
                    transform: "translateY(-3px) scale(1.02)",
                    boxShadow: "0px 8px 18px rgba(0,0,0,0.4)",
                  },
                  "&:active": { transform: "scale(0.97)" },
                  "&.Mui-disabled": {
                    background: PALETTE.federalBlue,
                    color: PALETTE.honoluluBlue,
                    boxShadow: "none",
                    cursor: "not-allowed",
                    pointerEvents: "auto",
                    animation: "none",
                    opacity: 0.7,
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
