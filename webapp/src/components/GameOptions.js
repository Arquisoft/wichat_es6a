import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const GameOptions = () => {
  const navigate = useNavigate();
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

  const handleCategorySelect = (category) => {
    navigate("/game", { state: { category } });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 5,
        background: "linear-gradient(135deg, #e0f7fa 0%, #80deea 100%)",
        borderRadius: 12,
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
        maxWidth: 1200, // Aumentamos el ancho para 4 columnas
        margin: "0 auto",
        mt: 4,
        border: "2px solid #0288d1",
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: "bold",
          color: "#01579b",
          textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)",
          mb: 4,
        }}
      >
        Selecciona una Categoría
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr", // 1 columna en pantallas muy pequeñas
            sm: "repeat(2, 1fr)", // 2 columnas en pantallas pequeñas
            md: "repeat(3, 1fr)", // 3 columnas en pantallas medianas
            lg: "repeat(4, 1fr)", // 4 columnas en pantallas grandes
          },
          gap: 3,
          width: "100%",
        }}
      >
        {categories.map((category) => (
          <Button
            key={category.endpoint}
            onClick={() => handleCategorySelect(category)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              backgroundColor: "#ffffff",
              borderRadius: 10,
              padding: 2,
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
                backgroundColor: "#f5f5f5",
              },
              "&:active": {
                transform: "scale(0.98)",
              },
              textTransform: "none",
            }}
          >
            <Box
              component="img"
              src={category.image}
              alt={`${category.name} icon`}
              sx={{
                width: "150px",
                height: "150px",
                objectFit: "contain",
                borderRadius: 8,
                border: "2px solid #0288d1",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: "#0288d1",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {category.name}
            </Typography>
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default GameOptions;
