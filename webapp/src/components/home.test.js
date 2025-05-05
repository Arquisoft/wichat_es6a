import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import Home from "./home"; 
import { MemoryRouter, Routes, Route } from "react-router-dom";

// --- Mockear dependencias ---
jest.mock("axios");

// --- Inicio de los Tests ---
describe("Componente Home", () => {
  // Limpiar mocks después de cada test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper para renderizar el componente dentro de un Router
  const renderHome = (initialState = null) => {
    const initialEntries = [{ pathname: "/", state: initialState }];
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test("renderiza correctamente elementos básicos y mensaje por defecto sin API Key", async () => {
    delete process.env.REACT_APP_LLM_API_KEY;

    renderHome(); // Sin estado inicial -> username = "Invitado/a"

    // Verificar elementos estáticos
    expect(screen.getByRole("heading", { name: /¡Bienvenido\/a!/i })).toBeInTheDocument();
    expect(screen.getByAltText(/Ilustración del juego WIQ/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Regístrate Gratis/i })).toBeInTheDocument();

    // Esperar y verificar el mensaje de bienvenida por defecto para "Invitado/a"
    expect(await screen.findByText(/¡Hola Invitado\/a! Bienvenido\/a a WIQ/i)).toBeInTheDocument();

    // Verificar que axios NO fue llamado (porque no hay API key)
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("muestra el nombre de usuario pasado por location.state", async () => {
    delete process.env.REACT_APP_LLM_API_KEY;
    renderHome({ username: "EstudiantePrueba" }); // Pasamos username en el estado

    // Esperar y verificar el mensaje de bienvenida con el nombre de usuario específico
    expect(await screen.findByText(/¡Hola EstudiantePrueba! Bienvenido\/a a WIQ/i)).toBeInTheDocument();

    // Verificar que axios NO fue llamado (porque no hay API key)
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("intenta obtener y muestra mensaje dinámico si API Key existe (caso éxito)", async () => {
    // Configurar API Key y mock de axios para éxito
    process.env.REACT_APP_LLM_API_KEY = "test-api-key";
    const dynamicMessage = "Mensaje dinámico de bienvenida para TestDynamic!";
    axios.post.mockResolvedValue({ data: { answer: dynamicMessage } });

    renderHome({ username: "TestDynamic" }); // Renderizar con usuario

    // Esperar a que aparezca el mensaje dinámico
    expect(await screen.findByText(dynamicMessage)).toBeInTheDocument();

    // Verificar que axios.post fue llamado correctamente
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/ask"), // Verifica parte de la URL
      expect.objectContaining({
        question: expect.stringContaining("TestDynamic"),
        apiKey: "test-api-key",
      })
    );
  });

  test("muestra mensaje por defecto y error Snackbar si fetch dinámico falla", async () => {
    // Configurar API Key y mock de axios para fallo
    process.env.REACT_APP_LLM_API_KEY = "test-api-key";
    axios.post.mockRejectedValue(new Error("Network Error"));

    renderHome({ username: "TestFail" }); // Renderizar con usuario

    // Esperar y verificar que se muestra el mensaje de bienvenida con el nombre correcto
    expect(await screen.findByText(/¡Hola TestFail! Bienvenido\/a a WIQ/i)).toBeInTheDocument();

    // Esperar y verificar que aparece el mensaje de error en el Snackbar
    expect(await screen.findByText(/Fallo al cargar el mensaje de bienvenida dinámico./i)).toBeInTheDocument();

    // Verificar que axios.post fue llamado
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  // Test de Navegación (Simplificado con MemoryRouter comprobando contenido NO home)
  // Test de Navegación (Simplificado con MemoryRouter comprobando contenido NO home)
test('navega a /statistics al hacer clic en el botón "Ver Estadísticas"', async () => {
  // Mock localStorage to simulate a registered user
  const localStorageMock = {
    getItem: jest.fn().mockReturnValue("Gamer"),
  };
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });

  const initialEntries = [{ pathname: "/", state: { username: "Gamer" } }];
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/statistics" element={<div>Statistics Page</div>} />
      </Routes>
    </MemoryRouter>
  );

  // Encuentra y hace clic en el botón
  const statsButton = screen.getByRole("button", {
    name: /Ver Estadísticas/i,
  });
  fireEvent.click(statsButton);

  // Verifica que el contenido de la nueva página es visible
  expect(await screen.findByText("Statistics Page")).toBeInTheDocument();
  // Verifica que el contenido de Home ya no está
  expect(screen.queryByRole("heading", { name: /¡Bienvenido\/a!/i })).not.toBeInTheDocument();
});

  // Test de navegación a la página de "¿Cómo Jugar?"
  test('navega a /how-to-play al hacer clic en el botón "¿Cómo Jugar?"', async () => {
    const initialEntries = [{ pathname: "/", state: { username: "User" } }];
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-to-play" element={<div>How to Play Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Encuentra y hace clic en el botón
    const howToPlayButton = screen.getByRole("button", {
      name: /¿Cómo Jugar\?/i,
    });
    fireEvent.click(howToPlayButton);

    // Verifica que el contenido de la nueva página es visible
    expect(await screen.findByText("How to Play Page")).toBeInTheDocument();
    // Verifica que el contenido de Home ya no está
    expect(screen.queryByRole("heading", { name: /¡Bienvenido\/a!/i })).not.toBeInTheDocument();
  });

  // Test de navegación a la página de "Consultar Preguntas"
  test('navega a /questions al hacer clic en el botón "Consultar Preguntas"', async () => {
    const initialEntries = [{ pathname: "/", state: { username: "User" } }];
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/questions" element={<div>Questions Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Encuentra y hace clic en el botón
    const questionsButton = screen.getByRole("button", {
      name: /Consultar Preguntas/i,
    });
    fireEvent.click(questionsButton);

    // Verifica que el contenido de la nueva página es visible
    expect(await screen.findByText("Questions Page")).toBeInTheDocument();
    // Verifica que el contenido de Home ya no está
    expect(screen.queryByRole("heading", { name: /¡Bienvenido\/a!/i })).not.toBeInTheDocument();
  });

  // Test para verificar si el mensaje de bienvenida es dinámico al no tener la API Key
  test("verifica si el mensaje de bienvenida se mantiene por defecto si la API Key no está configurada", async () => {
    delete process.env.REACT_APP_LLM_API_KEY;

    renderHome({ username: "NoAPIUser" }); // Renderizamos con un nombre de usuario

    // El mensaje debería ser el mensaje predeterminado ya que no hay API Key
    expect(await screen.findByText(/¡Hola NoAPIUser! Bienvenido\/a a WIQ/i)).toBeInTheDocument();

    // Verificar que axios NO fue llamado
    expect(axios.post).not.toHaveBeenCalled();
  });
});
