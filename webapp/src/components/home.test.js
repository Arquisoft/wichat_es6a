import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import Home from "./home";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// --- Mockear dependencias ---

jest.mock("axios");

// Mockear react-router-dom hooks
const mockNavigate = jest.fn();

const originalEnv = process.env;

// --- Inicio de los Tests ---

describe("Componente Home", () => {
  // Limpiar mocks después de cada test
  afterEach(() => {
    jest.clearAllMocks();
    // Restaurar variables de entorno originales
    process.env = originalEnv;
  });

  // Helper para renderizar el componente dentro de un Router
  const renderHome = (initialState = null) => {
    // Usamos MemoryRouter para simular la navegación y el estado de location
    // La ruta inicial '/' simula estar en la Home
    // Pasamos el estado inicial a la ruta
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
    expect(
      screen.getByRole("heading", { name: /¡Bienvenido\/a!/i })
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(/Ilustración del juego WIQ/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /🎮 Empezar a Jugar/i })
    ).toBeInTheDocument();

    // Esperar y verificar el mensaje de bienvenida por defecto para "Invitado/a"
    // Usamos findByText que espera a que aparezca el elemento
    expect(
      await screen.findByText(/¡Hola Invitado\/a! Bienvenido\/a a WIQ/i)
    ).toBeInTheDocument();

    // Verificar que axios NO fue llamado (porque no hay API key)
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("muestra el nombre de usuario pasado por location.state", async () => {
    delete process.env.REACT_APP_LLM_API_KEY;
    renderHome({ username: "EstudiantePrueba" }); // Pasamos username en el estado

    // Esperar y verificar el mensaje de bienvenida con el nombre de usuario específico
    expect(
      await screen.findByText(/¡Hola EstudiantePrueba! Bienvenido\/a a WIQ/i)
    ).toBeInTheDocument();
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
        // Verifica parte del body
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

    // Esperar y verificar que se muestra el mensaje por defecto CON el nombre correcto
    expect(
      await screen.findByText(/¡Hola TestFail! Bienvenido\/a a WIQ/i)
    ).toBeInTheDocument();

    // Esperar y verificar que aparece el mensaje de error en el Snackbar
    // Nota: El texto podría estar dentro de un elemento específico del Snackbar
    expect(
      await screen.findByText(
        /Fallo al cargar el mensaje de bienvenida dinámico./i
      )
    ).toBeInTheDocument();

    // Verificar que axios.post fue llamado
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  // Test de Navegación (Simplificado con MemoryRouter comprobando contenido NO home)
  test('navega a /game-options al hacer clic en el botón "Empezar a Jugar"', async () => {
    const initialEntries = [{ pathname: "/", state: { username: "Gamer" } }];
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game-options" element={<div>Game Options Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Encuentra y hace clic en el botón
    const playButton = screen.getByRole("button", {
      name: /🎮 Empezar a Jugar/i,
    });
    fireEvent.click(playButton);

    // Verifica que el contenido de la nueva página es visible
    expect(await screen.findByText("Game Options Page")).toBeInTheDocument();
    // Verifica que el contenido de Home ya no está (o partes clave de él)
    expect(
      screen.queryByRole("heading", { name: /¡Bienvenido\/a!/i })
    ).not.toBeInTheDocument();
  });
});
