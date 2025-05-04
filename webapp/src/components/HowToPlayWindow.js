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
  CardContent
} from "@mui/material";
import {
  Info,
  Star,
  VideogameAsset,
  Tune,
  Score,
  Home
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { keyframes } from "@mui/material";

// Keyframes para la animación de fondo
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export default function GameInfoWindow() {
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#ffffff',
      p: 3,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Encabezado */}
      <Box textAlign="center" mt={4} mb={6}>
  <Avatar
    sx={{
      bgcolor: 'rgba(255,255,255,0.2)',
      width: 100,
      height: 100,
      mx: 'auto',
      mb: 3,
      backdropFilter: 'blur(5px)'
    }}
  >
    <Info sx={{ fontSize: 50 }} />
  </Avatar>

  <Typography
    variant="h3"
    fontWeight="bold"
    gutterBottom
    textAlign="center" 
  >
    Cómo jugar a WICHAT
  </Typography>

  <Chip
    label="Guía del jugador"
    icon={<Info />}
    sx={{
      bgcolor: 'rgba(255,255,255,0.15)',
      color: '#ffffff',
      fontSize: '1rem',
      py: 1.5
    }}
  />
</Box>
      {/* Contenido principal */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        maxWidth: '1200px',
        mx: 'auto',
        width: '100%'
      }}>
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Introducción */}
          <Grid item xs={12}>
            <Card sx={{
              background: 'linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)',
              backgroundSize: '200% 200%',
              animation: `${gradientAnimation} 15s ease infinite`,
              p: 4,
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.2)'
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 3,
                  color: '#000000'
                }}
              >
                <Info sx={{ mr: 2, fontSize: '2rem', color: '#01579B' }} />
                Introducción
              </Typography>
              <CardContent>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  Bienvenido a WICHAT, un emocionante juego de trivia donde podrás poner a prueba tus conocimientos sobre múltiples temáticas. Esta guía te ayudará a entender las mecánicas básicas del juego para que puedas utilizar todas tus habilidades y obtener la mayor puntuación posible.
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  El juego consiste en responder una serie de preguntas de opción múltiple, en las que solo una respuesta es correcta. Para ayudarte, podrás hacer uso de varios comodines que te facilitarán encontrar la respuesta adecuada, aunque con una penalización en la puntuación.
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  Cada pregunta viene acompañada de una imagen que te ayudará a ponerte en contexto y, en ocasiones, te proporcionará una pista extra. Pero no todo es bueno, debes tener cuidado, pues cada pregunta tiene un límite de tiempo para ser respondida. Deberás jugar bien tus cartas para alzarte con la victoria.
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  Si bien la puntuación obtenida es importante para ganar, deberás responder al menos la mitad de las preguntas correctamente. Podrás consultar tus estadísticas en el juego siempre que inicies sesión.
                </Typography>
                <CardMedia
                  component="img"
                  image="./info-window/info-introducction.png"
                  alt="Captura de la pantalla inicial"
                  sx={{
                    borderRadius: 2,
                    width: '55%',
                    height: 'auto',
                    objectFit: 'contain',
                    mt: 2,
                    mx: 'auto'
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Comodines */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)',
              backgroundSize: '200% 200%',
              animation: `${gradientAnimation} 15s ease infinite`,
              p: 4,
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.2)',
              height: '100%'
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 3,
                  color: '#000000'
                }}
              >
                <Star sx={{ mr: 2, fontSize: '2rem', color: '#F57C00' }} />
                Comodines
              </Typography>
              <CardContent>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  Los comodines son elementos especiales que te dan ventajas únicas para ayudarte a encontrar la solución correcta, pero cuidado, también acarrearán una penalización en la puntuación obtenida en esa pregunta. Podrás encontrarlos a la derecha de la imagen de la pregunta.
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  Aquí tienes los comodines disponibles y su habilidad:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                  <li>
                    <Typography variant="body2" sx={{ color: '#000000', textAlign: 'justify' }}>
                      <strong>Comodín Pista</strong>: Este comodín activará el chat con la IA y hará que esta te proporcione una pista aleatoria generada por ella. Tiene una penalización de 15 puntos.
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/comodin-pista.png"
                      alt="Captura del comodín pista"
                      sx={{
                        borderRadius: 2,
                        width: '35%',
                        height: 'auto',
                        objectFit: 'contain',
                        mt: 2,
                        mx: 'auto'
                      }}
                    />
                  </li>
                  <li>
                    <Typography variant="body2" sx={{ color: '#000000', textAlign: 'justify' }}>
                      <strong>Comodín Preguntar IA</strong>: Este comodín activará también el chat con la IA y te permitirá que tú mismo le preguntes lo que quieras, pero cuidado, no pienses que te dará la solución tan fácilmente. Tiene una penalización de 25 puntos.
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/comodin-preguntar-IA.png"
                      alt="Captura del comodín preguntar IA"
                      sx={{
                        borderRadius: 2,
                        width: '35%',
                        height: 'auto',
                        objectFit: 'contain',
                        mt: 2,
                        mx: 'auto'
                      }}
                    />
                  </li>
                  <li>
                    <Typography variant="body2" sx={{ color: '#000000', textAlign: 'justify' }}>
                      <strong>Comodín 50/50</strong>: Este comodín descartará dos de las respuestas incorrectas, haciendo que solo tengas que elegir entre dos opciones y aumentando tus posibilidades de acierto a un 50%. Este comodín tiene una penalización de 40 puntos.
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/comodin-50-50.png"
                      alt="Captura del comodín 50/50"
                      sx={{
                        borderRadius: 2,
                        width: '35%',
                        height: 'auto',
                        objectFit: 'contain',
                        mt: 2,
                        mx: 'auto'
                      }}
                    />
                  </li>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Modos de Juego */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)',
              backgroundSize: '200% 200%',
              animation: `${gradientAnimation} 15s ease infinite`,
              p: 4,
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.2)',
              height: '100%'
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 3,
                  color: '#000000'
                }}
              >
                <VideogameAsset sx={{ mr: 2, fontSize: '2rem', color: '#AD1457' }} />
                Modos de juego
              </Typography>
              <CardContent>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  WICHAT ofrece varios modos de juego para que elijas la categoría que más te guste como temática para tus preguntas. Puedes elegir entre 7 temáticas diferentes que van desde monumentos hasta Fórmula 1, permitiéndote demostrar tus conocimientos en estos campos específicos. Si no te decides por ninguna, puedes probar el modo variado, que combinará preguntas aleatoriamente de todas las categorías disponibles, permitiéndote explorar todas ellas.
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  El modo de juego deberás seleccionarlo siempre antes de comenzar una partida, ya que no podrás cambiarlo una vez que hayas comenzado. El modo de juego jugado aparecerá también reflejado en las estadísticas de la partida si has iniciado sesión.
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  Los modos de juego disponibles son:
                </Typography>
                <CardMedia
                  component="img"
                  image="./info-window/modos-juego.png"
                  alt="Captura de los modos de juego"
                  sx={{
                    borderRadius: 2,
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    mt: 2,
                    mx: 'auto'
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Dificultades */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)',
              backgroundSize: '200% 200%',
              animation: `${gradientAnimation} 15s ease infinite`,
              p: 4,
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.2)',
              height: '100%'
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 3,
                  color: '#000000'
                }}
              >
                <Tune sx={{ mr: 2, fontSize: '2rem', color: '#7B1FA2' }} />
                Dificultades
              </Typography>
              <CardContent>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  Además de elegir temática para tus partidas, WICHAT te permite seleccionar también la dificultad en la que vas a jugar. La aplicación cuenta con tres niveles de dificultad: fácil, medio y difícil. La dificultad afecta únicamente al número de preguntas de la partida y al tiempo que tendrás para responderlas. A mayor dificultad, menos tiempo tendrás para responder y más preguntas tendrás que responder correctamente para ganar.
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  Deberás seleccionar la dificultad antes de comenzar una partida, junto con la temática, y no podrás cambiarla una vez que hayas comenzado.
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  Información de las dificultades:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                  <li>
                    <Typography variant="body2" sx={{ color: '#000000', textAlign: 'justify' }}>
                      <strong>Fácil</strong>:
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/dificultad-facil.png"
                      alt="Captura de la dificultad fácil"
                      sx={{
                        borderRadius: 2,
                        width: '60%',
                        height: 'auto',
                        objectFit: 'contain',
                        mt: 2,
                        mx: 'auto'
                      }}
                    />
                  </li>
                  <li>
                    <Typography variant="body2" sx={{ color: '#000000', textAlign: 'justify' }}>
                      <strong>Medio</strong>:
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/dificultad-media.png"
                      alt="Captura de la dificultad media"
                      sx={{
                        borderRadius: 2,
                        width: '60%',
                        height: 'auto',
                        objectFit: 'contain',
                        mt: 2,
                        mx: 'auto'
                      }}
                    />
                  </li>
                  <li>
                    <Typography variant="body2" sx={{ color: '#000000', textAlign: 'justify' }}>
                      <strong>Difícil</strong>:
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/dificultad-dificil.png"
                      alt="Captura de la dificultad difícil"
                      sx={{
                        borderRadius: 2,
                        width: '60%',
                        height: 'auto',
                        objectFit: 'contain',
                        mt: 2,
                        mx: 'auto'
                      }}
                    />
                  </li>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Puntuación */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'linear-gradient(135deg, #e0f2ff, #c2e5ff, #a8d8ff)',
              backgroundSize: '200% 200%',
              animation: `${gradientAnimation} 15s ease infinite`,
              p: 4,
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.2)',
              height: '100%'
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 3,
                  color: '#000000'
                }}
              >
                <Score sx={{ mr: 2, fontSize: '2rem', color: '#388E3C' }} />
                Puntuación
              </Typography>
              <CardContent>
                <Typography variant="body1" sx={{ mb: 3, color: '#000000', textAlign: 'justify' }}>
                  Tu puntuación refleja tu habilidad en el juego, así como tus conocimientos sobre la temática jugada. Cada pregunta acertada en WICHAT te otorgará 100 puntos, mientras que las preguntas falladas no te otorgarán ni quitarán puntos. Puedes consultar en todo momento de tu partida tu puntuación actual a la derecha de la pregunta. También, al terminar la partida, se te mostrará tu puntuación final, así como las estadísticas de la partida. Hay varias mecánicas que alteran la obtención de los puntos y estas son:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                  <li>
                    <Typography variant="body2" sx={{ color: '#000000', textAlign: 'justify' }}>
                      <strong>Comodines</strong>: Los comodines son ayudas para resolver las preguntas en tu partida, pero estos acarrearán una penalización en la puntuación. Por lo tanto, si aciertas una pregunta habiendo usado uno, obtendrás menos puntos; en caso de fallarla, no te preocupes, no se te restarán de los ya obtenidos. Puedes consultar las penalizaciones de cada comodín en la sección correspondiente de esta guía.
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/comodines.png"
                      alt="Captura de los comodines"
                      sx={{
                        borderRadius: 2,
                        width: '60%',
                        height: 'auto',
                        objectFit: 'contain',
                        mt: 2,
                        mx: 'auto'
                      }}
                    />
                  </li>
                  <li>
                    <Typography variant="body2" sx={{ color: '#000000', textAlign: 'justify' }}>
                      <strong>Racha de aciertos</strong>: WICHAT cuenta con un sistema de racha que te recompensa por acertar preguntas de forma consecutiva. Tu racha actual se muestra a la derecha de tu puntuación, acompañada del icono de una llama roja. Por cada pregunta acertada consecutivamente, aumentará tu racha en 1 y, con ello, los puntos ganados. Por cada punto de racha acumulado, se te otorgarán 20 puntos extra en la puntuación de la pregunta.
                    </Typography>
                    <CardMedia
                      component="img"
                      image="./info-window/racha-aciertos.png"
                      alt="Captura de la racha de aciertos"
                      sx={{
                        borderRadius: 2,
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        mt: 2,
                        mx: 'auto'
                      }}
                    />
                  </li>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Botones de acción */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: 3,
          flexWrap: 'wrap',
          mb: 4
        }}>
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => navigate("/home")}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 50,
              bgcolor: '#ffffff',
              color: '#1976D2',
              '&:hover': {
                bgcolor: '#f5f5f5',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Menú principal
          </Button>
        </Box>
      </Box>
    </Box>
  );
}