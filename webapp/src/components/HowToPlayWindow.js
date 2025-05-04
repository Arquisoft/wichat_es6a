import React from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Avatar,
  Card,
  CardMedia,
  CardContent,
} from "@mui/material";
import {
  Info,
  Star,
  VideogameAsset,
  Tune,
  Score,
  Home,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { keyframes } from "@mui/material";

// Animaciones
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const borderPulse = keyframes`
  0% { box-shadow: 0 0 5px ${"#0077b6ff"}, 0 0 10px ${"#0077b6ff"}; }
  50% { box-shadow: 0 0 10px ${"#0077b6ff"}, 0 0 20px ${"#0077b6ff"}; }
  100% { box-shadow: 0 0 5px ${"#0077b6ff"}, 0 0 10px ${"#0077b6ff"}; }
`;

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

export default function HowToPlayWindow() {
  const navigate = useNavigate();

  // Definir la paleta de colores
  const colors = {
    federalBlue: "#03045eff",
    honoluluBlue: "#0077b6ff",
    pacificCyan: "#00b4d8ff",
    nonPhotoBlue: "#90e0efff",
    lightCyan: "#caf0f8ff",
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `radial-gradient(circle at center, ${colors.pacificCyan} 0%, ${colors.lightCyan} 50%, ${colors.nonPhotoBlue} 100%)`,
        backgroundSize: "200% 200%",
        animation: `${gradientAnimation} 12s ease infinite`,
        color: colors.federalBlue,
        p: 3,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
      data-testid="game-info-window"
    >
      {/* Encabezado */}
      <Box textAlign="center" mt={4} mb={6} data-testid="header-section">
        <Avatar
          sx={{
            bgcolor: `rgba(${parseInt(
              colors.lightCyan.slice(1, 3),
              16
            )},${parseInt(colors.lightCyan.slice(3, 5), 16)},${parseInt(
              colors.lightCyan.slice(5, 7),
              16
            )},0.3)`,
            width: 120,
            height: 120,
            mx: "auto",
            mb: 3,
            backdropFilter: "blur(5px)",
            animation: `${pulseAnimation} 2s ease-in-out infinite`,
            boxShadow: `0 0 15px ${colors.pacificCyan}`,
            transition: "transform 0.3s ease",
            "&:hover": {
              transform: "scale(1.1)",
            },
          }}
          data-testid="avatar-header"
        >
          <Info sx={{ fontSize: 60, color: colors.federalBlue }} />
        </Avatar>

        <Typography
          variant="h3"
          fontWeight="bold"
          gutterBottom
          textAlign="center"
          sx={{
            color: colors.federalBlue,
            textShadow: `2px 2px 4px rgba(0,0,0,0.2)`,
            position: "relative",
            "&:after": {
              content: '""',
              position: "absolute",
              bottom: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: "50%",
              height: 4,
              background: `linear-gradient(90deg, ${colors.pacificCyan}, ${colors.honoluluBlue})`,
              borderRadius: 2,
            },
          }}
          data-testid="header-title"
        >
          Cómo jugar a WICHAT
        </Typography>

        <Chip
          label="Guía del jugador"
          icon={<Info />}
          sx={{
            bgcolor: `rgba(${parseInt(
              colors.lightCyan.slice(1, 3),
              16
            )},${parseInt(colors.lightCyan.slice(3, 5), 16)},${parseInt(
              colors.lightCyan.slice(5, 7),
              16
            )},0.3)`,
            color: colors.federalBlue,
            fontSize: "1rem",
            py: 2,
            px: 3,
            borderRadius: 20,
            animation: `${pulseAnimation} 3s ease-in-out infinite`,
            transition: "all 0.3s ease",
            "&:hover": {
              bgcolor: colors.pacificCyan,
              transform: "rotate(5deg)",
            },
          }}
          data-testid="header-chip"
        />
      </Box>
      {/* Contenido principal */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "1200px",
          mx: "auto",
          width: "100%",
        }}
        data-testid="main-content"
      >
        <Grid container spacing={4} sx={{ mb: 6 }} data-testid="content-grid">
          {/* Introducción */}
          <Grid item xs={12} data-testid="introduction-grid">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${colors.lightCyan}, ${colors.pacificCyan})`,
                backgroundSize: "200% 200%",
                animation: `${gradientAnimation} 6s ease infinite, ${fadeIn} 1s ease-out, ${borderPulse} 4s ease-in-out infinite`,
                p: 4,
                borderRadius: 16,
                border: `2px solid ${colors.honoluluBlue}`,
                boxShadow: `0 8px 16px rgba(0,0,0,0.1)`,
                backdropFilter: "blur(10px)",
                backgroundColor: `rgba(255,255,255,0.1)`,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: `0 12px 24px rgba(0,0,0,0.2)`,
                },
              }}
              data-testid="introduction-card"
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 3,
                  color: colors.federalBlue,
                  fontWeight: "bold",
                  textShadow: `1px 1px 2px rgba(0,0,0,0.1)`,
                  transition: "color 0.3s ease",
                  "&:hover": {
                    color: colors.honoluluBlue,
                  },
                }}
                data-testid="introduction-title"
              >
                <Info
                  sx={{
                    mr: 2,
                    fontSize: "2rem",
                    color: colors.federalBlue,
                    transition: "transform 0.3s ease, color 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.2)",
                      color: colors.pacificCyan,
                    },
                  }}
                />
                Introducción
              </Typography>
              <CardContent data-testid="introduction-content">
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="introduction-text-1"
                >
                  Bienvenido a WICHAT, un emocionante juego de trivia donde
                  podrás poner a prueba tus conocimientos sobre múltiples
                  temáticas. Esta guía te ayudará a entender las mecánicas
                  básicas del juego para que puedas utilizar todas tus
                  habilidades y obtener la mayor puntuación posible.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="introduction-text-2"
                >
                  El juego consiste en responder una serie de preguntas de
                  opción múltiple, en las que solo una respuesta es correcta.
                  Para ayudarte, podrás hacer uso de varios comodines que te
                  facilitarán encontrar la respuesta adecuada, aunque con una
                  penalización en la puntuación.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="introduction-text-3"
                >
                  Cada pregunta viene acompañada de una imagen que te ayudará a
                  ponerte en contexto y, en ocasiones, te proporcionará una
                  pista extra. Pero no todo es bueno, debes tener cuidado, pues
                  cada pregunta tiene un límite de tiempo para ser respondida.
                  Deberás jugar bien tus cartas para alzarte con la victoria.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="introduction-text-4"
                >
                  Si bien la puntuación obtenida es importante para ganar,
                  deberás responder al menos la mitad de las preguntas
                  correctamente. Podrás consultar tus estadísticas en el juego
                  siempre que inicies sesión.
                </Typography>
                <CardMedia
                  component="img"
                  image="./info-window/info-introducction.png"
                  alt="Captura de la pantalla inicial"
                  sx={{
                    borderRadius: 8,
                    width: "55%",
                    height: "auto",
                    objectFit: "contain",
                    mt: 2,
                    mx: "auto",
                    boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                  }}
                  data-testid="introduction-image"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Comodines */}
          <Grid item xs={12} md={6} data-testid="wildcards-grid">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${colors.lightCyan}, ${colors.pacificCyan})`,
                backgroundSize: "200% 200%",
                animation: `${gradientAnimation} 6s ease infinite, ${fadeIn} 1.2s ease-out, ${borderPulse} 4s ease-in-out infinite`,
                p: 4,
                borderRadius: 16,
                border: `2px solid ${colors.honoluluBlue}`,
                boxShadow: `0 8px 16px rgba(0,0,0,0.1)`,
                backdropFilter: "blur(10px)",
                backgroundColor: `rgba(255,255,255,0.1)`,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: `0 12px 24px rgba(0,0,0,0.2)`,
                },
                height: "100%",
              }}
              data-testid="wildcards-card"
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 3,
                  color: colors.federalBlue,
                  fontWeight: "bold",
                  textShadow: `1px 1px 2px rgba(0,0,0,0.1)`,
                  transition: "color 0.3s ease",
                  "&:hover": {
                    color: colors.honoluluBlue,
                  },
                }}
                data-testid="wildcards-title"
              >
                <Star
                  sx={{
                    mr: 2,
                    fontSize: "2rem",
                    color: colors.federalBlue,
                    transition: "transform 0.3s ease, color 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.2)",
                      color: colors.pacificCyan,
                    },
                  }}
                />
                Comodines
              </Typography>
              <CardContent data-testid="wildcards-content">
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="wildcards-text-1"
                >
                  Los comodines son elementos especiales que te dan ventajas
                  únicas para ayudarte a encontrar la solución correcta, pero
                  cuidado, también acarrearán una penalización en la puntuación
                  obtenida en esa pregunta. Podrás encontrarlos a la derecha de
                  la imagen de la pregunta.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="wildcards-text-2"
                >
                  Aquí tienes los comodines disponibles y su habilidad:
                </Typography>
                <Box
                  component="ul"
                  sx={{ pl: 2, mb: 3 }}
                  data-testid="wildcards-list"
                >
                  <li>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.federalBlue,
                        textAlign: "justify",
                        transition: "color 0.3s ease",
                        "&:hover": {
                          color: colors.honoluluBlue,
                        },
                      }}
                      data-testid="wildcard-pista"
                    >
                      <strong>Comodín Pista</strong>: Este comodín activará el
                      chat con la IA y hará que esta te proporcione una pista
                      aleatoria generada por ella. Tiene una penalización de 15
                      puntos.
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/comodin-pista.png"
                      alt="Captura del comodín pista"
                      sx={{
                        borderRadius: 8,
                        width: "35%",
                        height: "auto",
                        objectFit: "contain",
                        mt: 2,
                        mx: "auto",
                        boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                      }}
                      data-testid="wildcard-pista-image"
                    />
                  </li>
                  <li>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.federalBlue,
                        textAlign: "justify",
                        transition: "color 0.3s ease",
                        "&:hover": {
                          color: colors.honoluluBlue,
                        },
                      }}
                      data-testid="wildcard-preguntar-ia"
                    >
                      <strong>Comodín Preguntar IA</strong>: Este comodín
                      activará también el chat con la IA y te permitirá que tú
                      mismo le preguntes lo que quieras, pero cuidado, no
                      pienses que te dará la solución tan fácilmente. Tiene una
                      penalización de 25 puntos.
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/comodin-preguntar-IA.png"
                      alt="Captura del comodín preguntar IA"
                      sx={{
                        borderRadius: 8,
                        width: "35%",
                        height: "auto",
                        objectFit: "contain",
                        mt: 2,
                        mx: "auto",
                        boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                      }}
                      data-testid="wildcard-preguntar-ia-image"
                    />
                  </li>
                  <li>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.federalBlue,
                        textAlign: "justify",
                        transition: "color 0.3s ease",
                        "&:hover": {
                          color: colors.honoluluBlue,
                        },
                      }}
                      data-testid="wildcard-50-50"
                    >
                      <strong>Comodín 50/50</strong>: Este comodín descartará
                      dos de las respuestas incorrectas, haciendo que solo
                      tengas que elegir entre dos opciones y aumentando tus
                      posibilidades de acierto a un 50%. Este comodín tiene una
                      penalización de 40 puntos.
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/comodin-50-50.png"
                      alt="Captura del comodín 50/50"
                      sx={{
                        borderRadius: 8,
                        width: "35%",
                        height: "auto",
                        objectFit: "contain",
                        mt: 2,
                        mx: "auto",
                        boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                      }}
                      data-testid="wildcard-50-50-image"
                    />
                  </li>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Modos de Juego */}
          <Grid item xs={12} md={6} data-testid="game-modes-grid">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${colors.lightCyan}, ${colors.pacificCyan})`,
                backgroundSize: "200% 200%",
                animation: `${gradientAnimation} 6s ease infinite, ${fadeIn} 1.4s ease-out, ${borderPulse} 4s ease-in-out infinite`,
                p: 4,
                borderRadius: 16,
                border: `2px solid ${colors.honoluluBlue}`,
                boxShadow: `0 8px 16px rgba(0,0,0,0.1)`,
                backdropFilter: "blur(10px)",
                backgroundColor: `rgba(255,255,255,0.1)`,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: `0 12px 24px rgba(0,0,0,0.2)`,
                },
                height: "100%",
              }}
              data-testid="game-modes-card"
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 3,
                  color: colors.federalBlue,
                  fontWeight: "bold",
                  textShadow: `1px 1px 2px rgba(0,0,0,0.1)`,
                  transition: "color 0.3s ease",
                  "&:hover": {
                    color: colors.honoluluBlue,
                  },
                }}
                data-testid="game-modes-title"
              >
                <VideogameAsset
                  sx={{
                    mr: 2,
                    fontSize: "2rem",
                    color: colors.federalBlue,
                    transition: "transform 0.3s ease, color 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.2)",
                      color: colors.pacificCyan,
                    },
                  }}
                />
                Modos de juego
              </Typography>
              <CardContent data-testid="game-modes-content">
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="game-modes-text-1"
                >
                  WICHAT ofrece varios modos de juego para que elijas la
                  categoría que más te guste como temática para tus preguntas.
                  Puedes elegir entre 7 temáticas diferentes que van desde
                  monumentos hasta Fórmula 1, permitiéndote demostrar tus
                  conocimientos en estos campos específicos. Si no te decides
                  por ninguna, puedes probar el modo variado, que combinará
                  preguntas aleatoriamente de todas las categorías disponibles,
                  permitiéndote explorar todas ellas.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="game-modes-text-2"
                >
                  El modo de juego deberás seleccionarlo siempre antes de
                  comenzar una partida, ya que no podrás cambiarlo una vez que
                  hayas comenzado. El modo de juego jugado aparecerá también
                  reflejado en las estadísticas de la partida si has iniciado
                  sesión.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="game-modes-text-3"
                >
                  Los modos de juego disponibles son:
                </Typography>
                <CardMedia
                  component="img"
                  image="./info-window/modos-juego.png"
                  alt="Captura de los modos de juego"
                  sx={{
                    borderRadius: 8,
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    mt: 2,
                    mx: "auto",
                    boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                  }}
                  data-testid="game-modes-image"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Dificultades */}
          <Grid item xs={12} md={6} data-testid="difficulties-grid">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${colors.lightCyan}, ${colors.pacificCyan})`,
                backgroundSize: "200% 200%",
                animation: `${gradientAnimation} 6s ease infinite, ${fadeIn} 1.6s ease-out, ${borderPulse} 4s ease-in-out infinite`,
                p: 4,
                borderRadius: 16,
                border: `2px solid ${colors.honoluluBlue}`,
                boxShadow: `0 8px 16px rgba(0,0,0,0.1)`,
                backdropFilter: "blur(10px)",
                backgroundColor: `rgba(255,255,255,0.1)`,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: `0 12px 24px rgba(0,0,0,0.2)`,
                },
                height: "100%",
              }}
              data-testid="difficulties-card"
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 3,
                  color: colors.federalBlue,
                  fontWeight: "bold",
                  textShadow: `1px 1px 2px rgba(0,0,0,0.1)`,
                  transition: "color 0.3s ease",
                  "&:hover": {
                    color: colors.honoluluBlue,
                  },
                }}
                data-testid="difficulties-title"
              >
                <Tune
                  sx={{
                    mr: 2,
                    fontSize: "2rem",
                    color: colors.federalBlue,
                    transition: "transform 0.3s ease, color 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.2)",
                      color: colors.pacificCyan,
                    },
                  }}
                />
                Dificultades
              </Typography>
              <CardContent data-testid="difficulties-content">
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="difficulties-text-1"
                >
                  Además de elegir temática para tus partidas, WICHAT te permite
                  seleccionar también la dificultad en la que vas a jugar. La
                  aplicación cuenta con tres niveles de dificultad: fácil, medio
                  y difícil. La dificultad afecta únicamente al número de
                  preguntas de la partida y al tiempo que tendrás para
                  responderlas. A mayor dificultad, menos tiempo tendrás para
                  responder y más preguntas tendrás que responder correctamente
                  para ganar.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="difficulties-text-2"
                >
                  Deberás seleccionar la dificultad antes de comenzar una
                  partida, junto con la temática, y no podrás cambiarla una vez
                  que hayas comenzado.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="difficulties-text-3"
                >
                  Información de las dificultades:
                </Typography>
                <Box
                  component="ul"
                  sx={{ pl: 2, mb: 3 }}
                  data-testid="difficulties-list"
                >
                  <li>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.federalBlue,
                        textAlign: "justify",
                        transition: "color 0.3s ease",
                        "&:hover": {
                          color: colors.honoluluBlue,
                        },
                      }}
                      data-testid="difficulty-easy"
                    >
                      <strong>Fácil</strong>:
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/dificultad-facil.png"
                      alt="Captura de la dificultad fácil"
                      sx={{
                        borderRadius: 8,
                        width: "60%",
                        height: "auto",
                        objectFit: "contain",
                        mt: 2,
                        mx: "auto",
                        boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                      }}
                      data-testid="difficulty-easy-image"
                    />
                  </li>
                  <li>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.federalBlue,
                        textAlign: "justify",
                        transition: "color 0.3s ease",
                        "&:hover": {
                          color: colors.honoluluBlue,
                        },
                      }}
                      data-testid="difficulty-medium"
                    >
                      <strong>Medio</strong>:
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/dificultad-media.png"
                      alt="Captura de la dificultad media"
                      sx={{
                        borderRadius: 8,
                        width: "60%",
                        height: "auto",
                        objectFit: "contain",
                        mt: 2,
                        mx: "auto",
                        boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                      }}
                      data-testid="difficulty-medium-image"
                    />
                  </li>
                  <li>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.federalBlue,
                        textAlign: "justify",
                        transition: "color 0.3s ease",
                        "&:hover": {
                          color: colors.honoluluBlue,
                        },
                      }}
                      data-testid="difficulty-hard"
                    >
                      <strong>Difícil</strong>:
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/dificultad-dificil.png"
                      alt="Captura de la dificultad difícil"
                      sx={{
                        borderRadius: 8,
                        width: "60%",
                        height: "auto",
                        objectFit: "contain",
                        mt: 2,
                        mx: "auto",
                        boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                      }}
                      data-testid="difficulty-hard-image"
                    />
                  </li>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Puntuación */}
          <Grid item xs={12} md={6} data-testid="scoring-grid">
            <Card
              sx={{
                background: `linear-gradient(135deg, ${colors.lightCyan}, ${colors.pacificCyan})`,
                backgroundSize: "200% 200%",
                animation: `${gradientAnimation} 6s ease infinite, ${fadeIn} 1.8s ease-out, ${borderPulse} 4s ease-in-out infinite`,
                p: 4,
                borderRadius: 16,
                border: `2px solid ${colors.honoluluBlue}`,
                boxShadow: `0 8px 16px rgba(0,0,0,0.1)`,
                backdropFilter: "blur(10px)",
                backgroundColor: `rgba(255,255,255,0.1)`,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: `0 12px 24px rgba(0,0,0,0.2)`,
                },
                height: "100%",
              }}
              data-testid="scoring-card"
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 3,
                  color: colors.federalBlue,
                  fontWeight: "bold",
                  textShadow: `1px 1px 2px rgba(0,0,0,0.1)`,
                  transition: "color 0.3s ease",
                  "&:hover": {
                    color: colors.honoluluBlue,
                  },
                }}
                data-testid="scoring-title"
              >
                <Score
                  sx={{
                    mr: 2,
                    fontSize: "2rem",
                    color: colors.federalBlue,
                    transition: "transform 0.3s ease, color 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.2)",
                      color: colors.pacificCyan,
                    },
                  }}
                />
                Puntuación
              </Typography>
              <CardContent data-testid="scoring-content">
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: colors.federalBlue,
                    textAlign: "justify",
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: colors.honoluluBlue,
                    },
                  }}
                  data-testid="scoring-text-1"
                >
                  Tu puntuación refleja tu habilidad en el juego, así como tus
                  conocimientos sobre la temática jugada. Cada pregunta acertada
                  en WICHAT te otorgará 100 puntos, mientras que las preguntas
                  falladas no te otorgarán ni quitarán puntos. Puedes consultar
                  en todo momento de tu partida tu puntuación actual a la
                  derecha de la pregunta. También, al terminar la partida, se te
                  mostrará tu puntuación final, así como las estadísticas de la
                  partida. Hay varias mecánicas que alteran la obtención de los
                  puntos y estas son:
                </Typography>
                <Box
                  component="ul"
                  sx={{ pl: 2, mb: 3 }}
                  data-testid="scoring-list"
                >
                  <li>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.federalBlue,
                        textAlign: "justify",
                        transition: "color 0.3s ease",
                        "&:hover": {
                          color: colors.honoluluBlue,
                        },
                      }}
                      data-testid="scoring-wildcards"
                    >
                      <strong>Comodines</strong>: Los comodines son ayudas para
                      resolver las preguntas en tu partida, pero estos
                      acarrearán una penalización en la puntuación. Por lo
                      tanto, si aciertas una pregunta habiendo usado uno,
                      obtendrás menos puntos; en caso de fallarla, no te
                      preocupes, no se te restarán de los ya obtenidos. Puedes
                      consultar las penalizaciones de cada comodín en la sección
                      correspondiente de esta guía.
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/comodines.png"
                      alt="Captura de los comodines"
                      sx={{
                        borderRadius: 8,
                        width: "60%",
                        height: "auto",
                        objectFit: "contain",
                        mt: 2,
                        mx: "auto",
                        boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                      }}
                      data-testid="scoring-wildcards-image"
                    />
                  </li>
                  <li>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.federalBlue,
                        textAlign: "justify",
                        transition: "color 0.3s ease",
                        "&:hover": {
                          color: colors.honoluluBlue,
                        },
                      }}
                      data-testid="scoring-streak"
                    >
                      <strong>Racha de aciertos</strong>: WICHAT cuenta con un
                      sistema de racha que te recompensa por acertar preguntas
                      de forma consecutiva. Tu racha actual se muestra a la
                      derecha de tu puntuación, acompañada del icono de una
                      llama roja. Por cada pregunta acertada consecutivamente,
                      aumentará tu racha en 1 y, con ello, los puntos ganados.
                      Por cada punto de racha acumulado, se te otorgarán 20
                      puntos extra en la puntuación de la pregunta.
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/racha-aciertos.png"
                      alt="Captura de la racha de aciertos"
                      sx={{
                        borderRadius: 8,
                        width: "100%",
                        height: "auto",
                        objectFit: "contain",
                        mt: 2,
                        mx: "auto",
                        boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                      }}
                      data-testid="scoring-streak-image"
                    />
                  </li>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Botones de acción */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 3,
            flexWrap: "wrap",
            mb: 4,
          }}
          data-testid="action-buttons"
        >
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => navigate("/home")}
            sx={{
              px: 5,
              py: 1.5,
              fontSize: "1.2rem",
              fontWeight: "bold",
              borderRadius: 50,
              bgcolor: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.nonPhotoBlue})`,
              color: colors.federalBlue,
              border: `3px solid ${colors.honoluluBlue}`,
              boxShadow: `0 4px 12px rgba(0,0,0,0.2)`,
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor: colors.pacificCyan,
                transform: "scale(1.05) translateY(-3px)",
                boxShadow: `0 8px 16px rgba(0,0,0,0.3)`,
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
            data-testid="home-button"
          >
            Menú principal
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
