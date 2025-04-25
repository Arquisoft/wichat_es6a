import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  Icon,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import BalanceIcon from "@mui/icons-material/Balance";
import WarningIcon from "@mui/icons-material/Warning";

const GameOptions = () => {
  const navigate = useNavigate();

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
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulties[1]);

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
    <Box
      sx={{
        padding: { xs: 2, sm: 3, md: 4 },
        background: "linear-gradient(135deg, #e0f7fa 0%, #80deea 100%)",
        borderRadius: 12,
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
        maxWidth: 1200,
        margin: "0 auto",
        mt: 4,
        border: "2px solid #0288d1",
      }}
    >
      <Grid container spacing={4}>
        {/* Columna Izquierda: Categorías */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            padding: { xs: 2, md: 3 },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#01579b",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)",
              mb: 3,
              textAlign: { xs: "center", md: "left" },
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
              flexGrow: 1,
            }}
          >
            {categories.map((category) => (
              <Button
                key={category.endpoint}
                onClick={() => handleCategoryButtonClick(category)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  backgroundColor: "#ffffff",
                  borderRadius: 10,
                  padding:
                    selectedCategory?.endpoint === category.endpoint
                      ? "13px"
                      : "14px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease, padding 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.03)",
                    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
                    backgroundColor: "#f8f9fa",
                  },
                  "&:active": { transform: "scale(0.99)" },
                  textTransform: "none",
                  minHeight: { xs: 180, sm: 200 },
                  border:
                    selectedCategory?.endpoint === category.endpoint
                      ? "4px solid #1e88e5"
                      : "2px solid transparent",
                }}
              >
                <Box
                  component="img"
                  src={category.image}
                  alt={`${category.name} icon`}
                  sx={{
                    width: { xs: 80, sm: 100, md: 120 },
                    height: { xs: 80, sm: 100, md: 120 },
                    objectFit: "contain",
                    borderRadius: 8,
                    mb: 1,
                  }}
                />
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#0277bd",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {category.name}
                </Typography>
              </Button>
            ))}
          </Box>
        </Grid>

        {/* Columna Derecha: Dificultad y Jugar */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            padding: { xs: 2, md: 3 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            mt: { xs: 4, md: 0 },
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#01579b",
              textShadow: "1px 1px 3px rgba(0, 0, 0, 0.1)",
              mb: 2,
            }}
          >
            Selecciona una Dificultad
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              mb: 1.5,
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
                  borderColor: difficulty.color,
                  color:
                    selectedDifficulty.name === difficulty.name
                      ? "#fff"
                      : difficulty.color,
                  backgroundColor:
                    selectedDifficulty.name === difficulty.name
                      ? difficulty.color
                      : "transparent",
                  "&:hover": {
                    backgroundColor:
                      selectedDifficulty.name !== difficulty.name
                        ? `${difficulty.color}1A`
                        : undefined,
                    borderColor: difficulty.color,
                  },
                }}
              >
                {difficulty.name}
              </Button>
            ))}
          </Box>
          <Box
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: 2,
              padding: 2,
              mt: 1,
              mb: 4,
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: "100%",
              maxWidth: 300,
              transition: "background-color 0.3s ease",
            }}
          >
            <Icon
              component={selectedDifficulty.icon}
              sx={{
                color: selectedDifficulty.color,
                fontSize: 28,
              }}
            />
            <Typography
              variant="subtitle1"
              sx={{
                color: selectedDifficulty.color,
                fontWeight: "600",
                textAlign: "left",
                fontStyle: "italic",
                textShadow: "0.5px 0.5px 1px rgba(0, 0, 0, 0.2)",
                transition: "color 0.3s ease-in-out",
              }}
            >
              {`${selectedDifficulty.questionCount} preguntas / ${selectedDifficulty.timePerQuestion} segundos por pregunta`}
            </Typography>
          </Box>

          {/* Botón Jugar */}
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={handlePlayClick}
            disabled={!selectedCategory}
            sx={{
              fontWeight: "bold",
              padding: "12px 30px",
              width: "80%",
              maxWidth: "250px",
            }}
          >
            Jugar
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GameOptions;
