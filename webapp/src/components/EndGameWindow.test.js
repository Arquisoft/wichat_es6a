// src/components/FullScreenScoreWindow.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FullScreenScoreWindow from "./EndGameWindow";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";

// Mocks de useNavigate y useLocation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: {
      score: 80,
      correctAnswers: 8,
      totalQuestions: 10,
      streak: 5,
      timeTaken: 50,
      category: "TestCat",
      difficulty: "Difícil",
    },
  }),
}));

// Helper para envolver con ThemeProvider
const renderWithTheme = (ui) => {
  const theme = createTheme({ palette: { mode: "light" } });
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe("FullScreenScoreWindow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header text and chips for category and difficulty", () => {
    renderWithTheme(<FullScreenScoreWindow />);

    expect(screen.getByText("¡Partida Finalizada!")).toBeInTheDocument();
    // Verifico la sección de chips
    expect(screen.getByText(/Categoría: TestCat/i)).toBeInTheDocument();
    expect(screen.getByText(/Dificultad: Difícil/i)).toBeInTheDocument();
  });

  it("displays the score with pts suffix", () => {
    renderWithTheme(<FullScreenScoreWindow />);

    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("pts")).toBeInTheDocument();
  });

  it("calculates and displays accuracy and average time per question", () => {
    renderWithTheme(<FullScreenScoreWindow />);

    // Precisión = 8/10 => 80%
    expect(screen.getByText("80%")).toBeInTheDocument();
    // Tiempo medio = 50/10 => 5.0 seg
    expect(screen.getByText("5.0 seg")).toBeInTheDocument();
  });

  it("shows the success icon when performance is a win", () => {
    renderWithTheme(<FullScreenScoreWindow />);
    expect(screen.getByTestId("CheckCircleIcon")).toBeInTheDocument();
  });

  it("shows counts of correct and incorrect answers", () => {
    renderWithTheme(<FullScreenScoreWindow />);
    expect(screen.getByText("8")).toBeInTheDocument(); // correctas
    expect(screen.getByText("2")).toBeInTheDocument(); // incorrectas
  });

  it("displays streak, total time and time per question stats", () => {
    renderWithTheme(<FullScreenScoreWindow />);
    expect(screen.getByText("5")).toBeInTheDocument(); // racha
    expect(screen.getByText("50 seg")).toBeInTheDocument(); // tiempo total
    expect(screen.getByText("5.0 seg")).toBeInTheDocument(); // avg
  });

  it("navigates to the correct routes when action buttons are clicked", () => {
    renderWithTheme(<FullScreenScoreWindow />);

    fireEvent.click(screen.getByRole("button", { name: /Jugar otra vez/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/game-options");

    fireEvent.click(screen.getByRole("button", { name: /Estadísticas/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/statistics");

    fireEvent.click(screen.getByRole("button", { name: /Menú principal/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });
});
