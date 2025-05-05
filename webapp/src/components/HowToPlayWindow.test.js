import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HowToPlayWindow from "./HowToPlayWindow";
import * as router from "react-router-dom";

// Mock the useNavigate hook
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("HowToPlayWindow", () => {
  let mockNavigate;

  beforeEach(() => {
    mockNavigate = jest.fn();
    router.useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the main container with correct styles", () => {
    render(
      <MemoryRouter>
        <HowToPlayWindow />
      </MemoryRouter>
    );

    const mainBox = screen.getByTestId("game-info-window");
    expect(mainBox).toBeInTheDocument();
    expect(mainBox).toHaveStyle({
      minHeight: "100vh",
      color: "#03045eff", // federalBlue
      padding: "24px",
      display: "flex",
      flexDirection: "column",
    });
  });

  it("renders the header section with correct text", () => {
    render(
      <MemoryRouter>
        <HowToPlayWindow />
      </MemoryRouter>
    );

    const headerSection = screen.getByTestId("header-section");
    expect(headerSection).toBeInTheDocument();
    expect(headerSection).toHaveStyle({
      textAlign: "center",
      marginTop: "32px",
      marginBottom: "48px",
    });

    const title = screen.getByTestId("header-title");
    expect(title).toHaveTextContent("Cómo jugar a WICHAT");

    const chip = screen.getByTestId("header-chip");
    expect(chip).toHaveTextContent("Guía del jugador");

    const avatar = screen.getByTestId("avatar-header");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveStyle({
      width: "120px",
      height: "120px",
    });
  });

  it("renders the Introduction section with correct text and image", () => {
    render(
      <MemoryRouter>
        <HowToPlayWindow />
      </MemoryRouter>
    );

    const introductionCard = screen.getByTestId("introduction-card");
    expect(introductionCard).toBeInTheDocument();

    expect(screen.getByTestId("introduction-title")).toHaveTextContent(
      "Introducción"
    );

    const texts = [
      {
        testId: "introduction-text-1",
        content:
          "Bienvenido a WICHAT, un emocionante juego de trivia donde podrás poner a prueba tus conocimientos sobre múltiples temáticas. Esta guía te ayudará a entender las mecánicas básicas del juego para que puedas utilizar todas tus habilidades y obtener la mayor puntuación posible.",
      },
      {
        testId: "introduction-text-2",
        content:
          "El juego consiste en responder una serie de preguntas de opción múltiple, en las que solo una respuesta es correcta. Para ayudarte, podrás hacer uso de varios comodines que te facilitarán encontrar la respuesta adecuada, aunque con una penalización en la puntuación.",
      },
      {
        testId: "introduction-text-3",
        content:
          "Cada pregunta viene acompañada de una imagen que te ayudará a ponerte en contexto y, en ocasiones, te proporcionará una pista extra. Pero no todo es bueno, debes tener cuidado, pues cada pregunta tiene un límite de tiempo para ser respondida. Deberás jugar bien tus cartas para alzarte con la victoria.",
      },
      {
        testId: "introduction-text-4",
        content:
          "Si bien la puntuación obtenida es importante para ganar, deberás responder al menos la mitad de las preguntas correctamente. Podrás consultar tus estadísticas en el juego siempre que inicies sesión.",
      },
    ];

    texts.forEach(({ testId, content }) => {
      const textElement = screen.getByTestId(testId);
      expect(textElement).toHaveTextContent(content);
      expect(textElement).toHaveStyle({
        textAlign: "justify",
        color: "#0077b6ff", // honoluluBlue
      });
    });

    const image = screen.getByTestId("introduction-image");
    expect(image).toHaveAttribute(
      "src",
      "./info-window/info-introducction.png"
    );
    expect(image).toHaveAttribute("alt", "Captura de la pantalla inicial");
    expect(image).toHaveStyle({ width: "55%" });
  });

  it("renders the Wildcards section with correct text and images", () => {
    render(
      <MemoryRouter>
        <HowToPlayWindow />
      </MemoryRouter>
    );

    const wildcardsCard = screen.getByTestId("wildcards-card");
    expect(wildcardsCard).toBeInTheDocument();

    expect(screen.getByTestId("wildcards-title")).toHaveTextContent(
      "Comodines"
    );

    const texts = [
      {
        testId: "wildcards-text-1",
        content:
          "Los comodines son elementos especiales que te dan ventajas únicas para ayudarte a encontrar la solución correcta, pero cuidado, también acarrearán una penalización en la puntuación obtenida en esa pregunta. Podrás encontrarlos a la derecha de la imagen de la pregunta.",
      },
      {
        testId: "wildcards-text-2",
        content: "Aquí tienes los comodines disponibles y su habilidad:",
      },
      {
        testId: "wildcard-pista",
        content:
          "Comodín Pista: Este comodín activará el chat con la IA y hará que esta te proporcione una pista aleatoria generada por ella. Tiene una penalización de 15 puntos.",
      },
      {
        testId: "wildcard-preguntar-ia",
        content:
          "Comodín Preguntar IA: Este comodín activará también el chat con la IA y te permitirá que tú mismo le preguntes lo que quieras, pero cuidado, no pienses que te dará la solución tan fácilmente. Tiene una penalización de 25 puntos.",
      },
      {
        testId: "wildcard-50-50",
        content:
          "Comodín 50/50: Este comodín descartará dos de las respuestas incorrectas, haciendo que solo tengas que elegir entre dos opciones y aumentando tus posibilidades de acierto a un 50%. Este comodín tiene una penalización de 40 puntos.",
      },
    ];

    texts.forEach(({ testId, content }) => {
      const textElement = screen.getByTestId(testId);
      expect(textElement).toHaveTextContent(content);
      expect(textElement).toHaveStyle({
        textAlign: "justify",
        color: "#0077b6ff", // honoluluBlue
      });
    });

    const images = [
      {
        testId: "wildcard-pista-image",
        src: "./info-window/comodin-pista.png",
        alt: "Captura del comodín pista",
        width: "35%",
      },
      {
        testId: "wildcard-preguntar-ia-image",
        src: "./info-window/comodin-preguntar-IA.png",
        alt: "Captura del comodín preguntar IA",
        width: "35%",
      },
      {
        testId: "wildcard-50-50-image",
        src: "./info-window/comodin-50-50.png",
        alt: "Captura del comodín 50/50",
        width: "35%",
      },
    ];

    images.forEach(({ testId, src, alt, width }) => {
      const image = screen.getByTestId(testId);
      expect(image).toHaveAttribute("src", src);
      expect(image).toHaveAttribute("alt", alt);
      expect(image).toHaveStyle({ width });
    });
  });

  it("renders the Game Modes section with correct text and image", () => {
    render(
      <MemoryRouter>
        <HowToPlayWindow />
      </MemoryRouter>
    );

    const gameModesCard = screen.getByTestId("game-modes-card");
    expect(gameModesCard).toBeInTheDocument();

    expect(screen.getByTestId("game-modes-title")).toHaveTextContent(
      "Modos de juego"
    );

    const texts = [
      {
        testId: "game-modes-text-1",
        content:
          "WICHAT ofrece varios modos de juego para que elijas la categoría que más te guste como temática para tus preguntas. Puedes elegir entre 7 temáticas diferentes que van desde monumentos hasta Fórmula 1, permitiéndote demostrar tus conocimientos en estos campos específicos. Si no te decides por ninguna, puedes probar el modo variado, que combinará preguntas aleatoriamente de todas las categorías disponibles, permitiéndote explorar todas ellas.",
      },
      {
        testId: "game-modes-text-2",
        content:
          "El modo de juego deberás seleccionarlo siempre antes de comenzar una partida, ya que no podrás cambiarlo una vez que hayas comenzado. El modo de juego jugado aparecerá también reflejado en las estadísticas de la partida si has iniciado sesión.",
      },
      {
        testId: "game-modes-text-3",
        content: "Los modos de juego disponibles son:",
      },
    ];

    texts.forEach(({ testId, content }) => {
      const textElement = screen.getByTestId(testId);
      expect(textElement).toHaveTextContent(content);
      expect(textElement).toHaveStyle({
        textAlign: "justify",
        color: "#0077b6ff", // honoluluBlue
      });
    });

    const image = screen.getByTestId("game-modes-image");
    expect(image).toHaveAttribute("src", "./info-window/modos-juego.png");
    expect(image).toHaveAttribute("alt", "Captura de los modos de juego");
    expect(image).toHaveStyle({ width: "100%" });
  });

  it("renders the Difficulties section with correct text and images", () => {
    render(
      <MemoryRouter>
        <HowToPlayWindow />
      </MemoryRouter>
    );

    const difficultiesCard = screen.getByTestId("difficulties-card");
    expect(difficultiesCard).toBeInTheDocument();

    expect(screen.getByTestId("difficulties-title")).toHaveTextContent(
      "Dificultades"
    );

    const texts = [
      {
        testId: "difficulties-text-1",
        content:
          "Además de elegir temática para tus partidas, WICHAT te permite seleccionar también la dificultad en la que vas a jugar. La aplicación cuenta con tres niveles de dificultad: fácil, medio y difícil. La dificultad afecta únicamente al número de preguntas de la partida y al tiempo que tendrás para responderlas. A mayor dificultad, menos tiempo tendrás para responder y más preguntas tendrás que responder correctamente para ganar.",
      },
      {
        testId: "difficulties-text-2",
        content:
          "Deberás seleccionar la dificultad antes de comenzar una partida, junto con la temática, y no podrás cambiarla una vez que hayas comenzado.",
      },
      {
        testId: "difficulties-text-3",
        content: "Información de las dificultades:",
      },
      {
        testId: "difficulty-easy",
        content: "Fácil:",
      },
      {
        testId: "difficulty-medium",
        content: "Medio:",
      },
      {
        testId: "difficulty-hard",
        content: "Difícil:",
      },
    ];

    texts.forEach(({ testId, content }) => {
      const textElement = screen.getByTestId(testId);
      expect(textElement).toHaveTextContent(content);
      expect(textElement).toHaveStyle({
        textAlign: "justify",
        color: "#0077b6ff", // honoluluBlue
      });
    });

    const images = [
      {
        testId: "difficulty-easy-image",
        src: "./info-window/dificultad-facil.png",
        alt: "Captura de la dificultad fácil",
        width: "60%",
      },
      {
        testId: "difficulty-medium-image",
        src: "./info-window/dificultad-media.png",
        alt: "Captura de la dificultad media",
        width: "60%",
      },
      {
        testId: "difficulty-hard-image",
        src: "./info-window/dificultad-dificil.png",
        alt: "Captura de la dificultad difícil",
        width: "60%",
      },
    ];

    images.forEach(({ testId, src, alt, width }) => {
      const image = screen.getByTestId(testId);
      expect(image).toHaveAttribute("src", src);
      expect(image).toHaveAttribute("alt", alt);
      expect(image).toHaveStyle({ width });
    });
  });

  it("renders the Scoring section with correct text and images", () => {
    render(
      <MemoryRouter>
        <HowToPlayWindow />
      </MemoryRouter>
    );

    const scoringCard = screen.getByTestId("scoring-card");
    expect(scoringCard).toBeInTheDocument();

    expect(screen.getByTestId("scoring-title")).toHaveTextContent("Puntuación");

    const texts = [
      {
        testId: "scoring-text-1",
        content:
          "Tu puntuación refleja tu habilidad en el juego, así como tus conocimientos sobre la temática jugada. Cada pregunta acertada en WICHAT te otorgará 100 puntos, mientras que las preguntas falladas no te otorgarán ni quitarán puntos. Puedes consultar en todo momento de tu partida tu puntuación actual a la derecha de la pregunta. También, al terminar la partida, se te mostrará tu puntuación final, así como las estadísticas de la partida. Hay varias mecánicas que alteran la obtención de los puntos y estas son:",
      },
      {
        testId: "scoring-wildcards",
        content:
          "Comodines: Los comodines son ayudas para resolver las preguntas en tu partida, pero estos acarrearán una penalización en la puntuación. Por lo tanto, si aciertas una pregunta habiendo usado uno, obtendrás menos puntos; en caso de fallarla, no te preocupes, no se te restarán de los ya obtenidos. Puedes consultar las penalizaciones de cada comodín en la sección correspondiente de esta guía.",
      },
      {
        testId: "scoring-streak",
        content:
          "Racha de aciertos: WICHAT cuenta con un sistema de racha que te recompensa por acertar preguntas de forma consecutiva. Tu racha actual se muestra a la derecha de tu puntuación, acompañada del icono de una llama roja. Por cada pregunta acertada consecutivamente, aumentará tu racha en 1 y, con ello, los puntos ganados. Por cada punto de racha acumulado, se te otorgarán 20 puntos extra en la puntuación de la pregunta.",
      },
    ];

    texts.forEach(({ testId, content }) => {
      const textElement = screen.getByTestId(testId);
      expect(textElement).toHaveTextContent(content);
      expect(textElement).toHaveStyle({
        textAlign: "justify",
        color: "#0077b6ff", // honoluluBlue
      });
    });

    const images = [
      {
        testId: "scoring-wildcards-image",
        src: "./info-window/comodines.png",
        alt: "Captura de los comodines",
        width: "60%",
      },
      {
        testId: "scoring-streak-image",
        src: "./info-window/racha-aciertos.png",
        alt: "Captura de la racha de aciertos",
        width: "100%",
      },
    ];

    images.forEach(({ testId, src, alt, width }) => {
      const image = screen.getByTestId(testId);
      expect(image).toHaveAttribute("src", src);
      expect(image).toHaveAttribute("alt", alt);
      expect(image).toHaveStyle({ width });
    });
  });

  it("renders and handles the navigation button correctly", () => {
    render(
      <MemoryRouter>
        <HowToPlayWindow />
      </MemoryRouter>
    );

    const actionButtons = screen.getByTestId("action-buttons");
    expect(actionButtons).toBeInTheDocument();
    expect(actionButtons).toHaveStyle({
      display: "flex",
      justifyContent: "center",
      gap: "24px",
      flexWrap: "wrap",
      marginBottom: "32px",
    });

    const button = screen.getByTestId("home-button");
    expect(button).toHaveTextContent("Menú principal");

    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });

  it("renders the grid structure correctly", () => {
    render(
      <MemoryRouter>
        <HowToPlayWindow />
      </MemoryRouter>
    );

    const grid = screen.getByTestId("content-grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveStyle({ marginBottom: "48px" });

    const gridItems = [
      "introduction-grid",
      "wildcards-grid",
      "game-modes-grid",
      "difficulties-grid",
      "scoring-grid",
    ];

    gridItems.forEach((testId) => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });
});
