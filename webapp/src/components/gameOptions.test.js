// src/components/GameOptions.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GameOptions from "./GameOptions";
import { useNavigate } from "react-router-dom";

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("GameOptions component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {}); // silenciar advertencias
  });

  it("renders 8 category buttons and default difficulty UI", () => {
    render(<GameOptions />);

    // Hay 8 nombres de categoría en el DOM
    const categoryNames = [
      "Paises",
      "Monumentos",
      "Elementos",
      "Peliculas",
      "Canciones",
      "Formula1",
      "Pinturas",
      "Variado",
    ];
    categoryNames.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });

    // Mediano está seleccionado por defecto (botón Contained)
    const medioBtn = screen.getByRole("button", { name: "Medio" });
    expect(medioBtn).toHaveClass("MuiButton-contained");

    // Descripción reflejando 5 preguntas / 30s
    expect(
      screen.getByText(/5 preguntas \/ 30s por pregunta/i)
    ).toBeInTheDocument();

    // Botón Jugar deshabilitado inicialmente
    expect(screen.getByRole("button", { name: "Jugar" })).toBeDisabled();
  });

  it("selects a category and enables Play button", () => {
    render(<GameOptions />);

    // Hacemos click en el texto "Países"
    const paisesLabel = screen.getByText("Paises");
    fireEvent.click(paisesLabel.closest("button"));

    // Ahora Jugar está habilitado
    expect(screen.getByRole("button", { name: "Jugar" })).toBeEnabled();
  });

  it("changes difficulty and updates description", () => {
    render(<GameOptions />);

    // Click en "Difícil"
    const dificilBtn = screen.getByRole("button", { name: "Difícil" });
    fireEvent.click(dificilBtn);

    // El botón Difícil pasa a contained
    expect(dificilBtn).toHaveClass("MuiButton-contained");

    // Descripción cambia a 6 preguntas / 15s
    expect(
      screen.getByText(/6 preguntas \/ 15s por pregunta/i)
    ).toBeInTheDocument();
  });

  it("navigates to /game with correct state when Play clicked", () => {
    render(<GameOptions />);

    // Seleccionar categoría y dificultad
    fireEvent.click(screen.getByText("Elementos").closest("button"));
    fireEvent.click(screen.getByRole("button", { name: "Fácil" }));

    // Click en Jugar
    fireEvent.click(screen.getByRole("button", { name: "Jugar" }));

    expect(mockNavigate).toHaveBeenCalledWith("/game", {
      state: {
        category: {
          name: "Elementos",
          endpoint: "/elementos",
          image: "/elementos.jpg",
        },
        difficulty: { name: "Fácil", questionCount: 4, timePerQuestion: 50 },
      },
    });
  });

  it("does not alert or navigate when Play clicked while disabled", () => {
    window.alert = jest.fn();
    render(<GameOptions />);

    // Botón Jugar está deshabilitado, click no hace nada
    const play = screen.getByRole("button", { name: "Jugar" });
    fireEvent.click(play);

    expect(window.alert).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
