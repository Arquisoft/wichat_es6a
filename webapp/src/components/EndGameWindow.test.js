import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FullScreenScoreWindow from "./EndGameWindow";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";

// Mocks de useNavigate y useLocation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
}));

// Helper para envolver con ThemeProvider
const renderWithTheme = (ui, themeMode = "light") => {
  const theme = createTheme({ palette: { mode: themeMode } });
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe("FullScreenScoreWindow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configuración predeterminada de useLocation
    useLocation.mockReturnValue({
      state: {
        score: 80,
        correctAnswers: 8,
        totalQuestions: 10,
        streak: 5,
        timeTaken: 50,
        category: "TestCat",
        difficulty: "Difícil",
      },
    });
  });

  it("renders header text and chips for category and difficulty", () => {
    renderWithTheme(<FullScreenScoreWindow />);
    expect(screen.getByText("¡Partida Finalizada!")).toBeInTheDocument();
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
    expect(screen.getByText("80%")).toBeInTheDocument(); // Precisión = 8/10
    expect(screen.getByText("5.0 seg")).toBeInTheDocument(); // Tiempo medio = 50/10
  });

  it("shows the success icon when performance is a win", () => {
    renderWithTheme(<FullScreenScoreWindow />);
    expect(screen.getByTestId("CheckCircleIcon")).toBeInTheDocument();
  });

  it("shows the failure icon when performance is a loss", () => {
    useLocation.mockReturnValue({
      state: {
        score: 30,
        correctAnswers: 3,
        totalQuestions: 10,
        streak: 2,
        timeTaken: 60,
        category: "TestCat",
        difficulty: "Medio",
      },
    });
    renderWithTheme(<FullScreenScoreWindow />);
    expect(screen.getByTestId("CancelIcon")).toBeInTheDocument();
  });

  it("shows counts of correct and incorrect answers", () => {
    renderWithTheme(<FullScreenScoreWindow />);
    expect(screen.getByText("8")).toBeInTheDocument(); // Correctas
    expect(screen.getByText("2")).toBeInTheDocument(); // Incorrectas
  });

  it("displays streak, total time and time per question stats", () => {
    renderWithTheme(<FullScreenScoreWindow />);
    expect(screen.getByText("5")).toBeInTheDocument(); // Racha
    expect(screen.getByText("50 seg")).toBeInTheDocument(); // Tiempo total
    expect(screen.getByText("5.0 seg")).toBeInTheDocument(); // Tiempo por pregunta
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

  it("renders correctly with dark theme", () => {
    renderWithTheme(<FullScreenScoreWindow />, "dark");
    expect(screen.getByText("¡Partida Finalizada!")).toBeInTheDocument();
    const container = screen.getByText("¡Partida Finalizada!").closest("div");
    expect(container).toHaveStyle("background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)");
  });

  it("applies correct difficulty chip color for Fácil", () => {
    useLocation.mockReturnValue({
      state: {
        score: 80,
        correctAnswers: 8,
        totalQuestions: 10,
        streak: 5,
        timeTaken: 50,
        category: "TestCat",
        difficulty: "Fácil",
      },
    });
    renderWithTheme(<FullScreenScoreWindow />);
    const chip = screen.getByText(/Dificultad: Fácil/i).closest("div");
    expect(chip).toHaveStyle("background-color: #4CAF50");
  });

  it("applies correct difficulty chip color for Medio", () => {
    useLocation.mockReturnValue({
      state: {
        score: 80,
        correctAnswers: 8,
        totalQuestions: 10,
        streak: 5,
        timeTaken: 50,
        category: "TestCat",
        difficulty: "Medio",
      },
    });
    renderWithTheme(<FullScreenScoreWindow />);
    const chip = screen.getByText(/Dificultad: Medio/i).closest("div");
    expect(chip).toHaveStyle("background-color: #FF9800");
  });

});