import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EditProfile from "./editProfileWindow";
import axios from "axios";

// Mock axios
jest.mock("axios");

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("EditProfile Component", () => {
  const userId = "12345";
  const token = "fake-token";
  const originalLocation = window.location;

  beforeAll(() => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === "_id") return userId;
      if (key === "token") return token;
      return null;
    });
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
    Storage.prototype.clear = jest.fn();

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => "blob:url");

    // Mock window.reload
    delete window.location;
    window.location = { reload: jest.fn() };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads and displays current username on mount", async () => {
    // Mock user fetch and profile-pic fetch
    axios.get
      .mockResolvedValueOnce({ data: { username: "john_doe" } }) // user data
      .mockResolvedValueOnce({ data: new Blob() }); // profile-pic blob

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    // Should show loading text
    expect(screen.getByText(/Cargando perfil.../i)).toBeInTheDocument();

    // Wait until loading finishes
    await waitFor(() => {
      expect(screen.queryByText(/Cargando perfil.../i)).not.toBeInTheDocument();
    });

    // Should populate username field
    const usernameField = screen.getByLabelText(/Nombre de Usuario/i);
    expect(usernameField.value).toBe("john_doe");
  });

  it("shows error when saving empty username", async () => {
    // Mock user fetch and profile-pic fetch
    axios.get
      .mockResolvedValueOnce({ data: { username: "john" } })
      .mockResolvedValueOnce({ data: new Blob() });

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.queryByText(/Cargando perfil/i)).not.toBeInTheDocument()
    );

    // Clear username
    fireEvent.change(screen.getByLabelText(/Nombre de Usuario/i), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Guardar Nombre/i }));

    expect(
      await screen.findByText(/El nombre de usuario no puede estar vacío./i)
    ).toBeInTheDocument();
  });

  it("saves username successfully", async () => {
    // Mock user fetch and profile-pic fetch
    axios.get
      .mockResolvedValueOnce({ data: { username: "john" } })
      .mockResolvedValueOnce({ data: new Blob() });
    axios.put.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.queryByText(/Cargando perfil/i)).not.toBeInTheDocument()
    );

    const usernameField = screen.getByLabelText(/Nombre de Usuario/i);
    fireEvent.change(usernameField, { target: { value: "jane" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar Nombre/i }));

    await waitFor(() => {
      // localStorage updated
      expect(localStorage.setItem).toHaveBeenCalledWith("username", "jane");
      // page reload
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it("shows password mismatch error", async () => {
    // Mock user fetch and profile-pic fetch
    axios.get
      .mockResolvedValueOnce({ data: { username: "john" } })
      .mockResolvedValueOnce({ data: new Blob() });

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.queryByText(/Cargando perfil/i)).not.toBeInTheDocument()
    );

    // Fill fields: only new and repeat
    fireEvent.change(screen.getByLabelText("Nueva Contraseña"), {
      target: { value: "pass1" },
    });
    fireEvent.change(screen.getByLabelText("Repetir Nueva Contraseña"), {
      target: { value: "pass2" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Guardar Contraseña/i })
    );

    expect(
      await screen.findByText(/Las nuevas contraseñas no coinciden./i)
    ).toBeInTheDocument();
  });

  it("shows error when current password is empty", async () => {
    // Mock user fetch and profile-pic fetch
    axios.get
      .mockResolvedValueOnce({ data: { username: "john" } })
      .mockResolvedValueOnce({ data: new Blob() });

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.queryByText(/Cargando perfil/i)).not.toBeInTheDocument()
    );

    // Fill fields: new and repeat match, leave current empty
    fireEvent.change(screen.getByLabelText("Nueva Contraseña"), {
      target: { value: "pass1" },
    });
    fireEvent.change(screen.getByLabelText("Repetir Nueva Contraseña"), {
      target: { value: "pass1" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Guardar Contraseña/i })
    );

    expect(
      await screen.findByText(/Por favor, ingresa tu contraseña actual./i)
    ).toBeInTheDocument();
  });

  it("saves password successfully", async () => {
    // Mock user fetch and profile-pic fetch
    axios.get
      .mockResolvedValueOnce({ data: { username: "john" } })
      .mockResolvedValueOnce({ data: new Blob() });
    axios.put.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.queryByText(/Cargando perfil/i)).not.toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText("Contraseña Actual"), {
      target: { value: "oldpass" },
    });
    fireEvent.change(screen.getByLabelText("Nueva Contraseña"), {
      target: { value: "pass1" },
    });
    fireEvent.change(screen.getByLabelText("Repetir Nueva Contraseña"), {
      target: { value: "pass1" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Guardar Contraseña/i })
    );

    await waitFor(() => {
      expect(
        screen.queryByText(/Error al cambiar la contraseña./i)
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/Contraseña actualizada con éxito./i)
      ).toBeInTheDocument();
    });
  });
});
