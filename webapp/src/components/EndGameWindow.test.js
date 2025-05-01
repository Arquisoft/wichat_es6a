// src/components/FullScreenScoreWindow.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FullScreenScoreWindow from "./EndGameWindow"; // Asegúrate de que la ruta sea correcta
import { useNavigate, useLocation } from "react-router-dom";

// Mocks de useNavigate y useLocation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
}));

// Configuración inicial del mock de useLocation
const defaultLocationState = {
  state: {
    score: 80,
    correctAnswers: 8,
    totalQuestions: 10,
    streak: 5,
    timeTaken: 50,
    category: "TestCat",
    difficulty: "Difícil",
  },
};

describe("FullScreenScoreWindow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocation.mockReturnValue(defaultLocationState);
  });

  it("renders header text and chips for category and difficulty", () => {
    render(<FullScreenScoreWindow />);

    expect(screen.getByText("¡Partida Finalizada!")).toBeInTheDocument();
    expect(screen.getByText(/Categoría: TestCat/i)).toBeInTheDocument();
    expect(screen.getByText(/Dificultad: Difícil/i)).toBeInTheDocument();
  });

  it("displays the score with pts suffix", () => {
    render(<FullScreenScoreWindow />);

    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("pts")).toBeInTheDocument();
  });

  it("calculates and displays accuracy and average time per question", () => {
    render(<FullScreenScoreWindow />);

    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("5.0 seg")).toBeInTheDocument();
  });

  it("shows the success icon when performance is a win", () => {
    render(<FullScreenScoreWindow />);

    expect(screen.getByTestId("CheckCircleIcon")).toBeInTheDocument();
  });

  it("shows the failure icon when performance is not a win", () => {
    useLocation.mockReturnValue({
      state: {
        score: 40,
        correctAnswers: 4,
        totalQuestions: 10,
        streak: 2,
        timeTaken: 60,
        category: "TestCat",
        difficulty: "Medio",
      },
    });

    render(<FullScreenScoreWindow />);

    expect(screen.getByTestId("CancelIcon")).toBeInTheDocument();
  });

  it("shows counts of correct and incorrect answers", () => {
    render(<FullScreenScoreWindow />);

    expect(screen.queryAllByText("8").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("2").length).toBeGreaterThan(0);
  });

  it("displays streak, total time, and time per question stats", () => {
    render(<FullScreenScoreWindow />);

    expect(screen.queryAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getByText("50 seg")).toBeInTheDocument();
    expect(screen.getByText("5.0 seg")).toBeInTheDocument();
  });

  it("navigates to the correct routes when action buttons are clicked", () => {
    render(<FullScreenScoreWindow />);

    fireEvent.click(screen.getByRole("button", { name: /Jugar otra vez/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/game-options");

    fireEvent.click(screen.getByRole("button", { name: /Estadísticas/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/statistics");

    fireEvent.click(screen.getByRole("button", { name: /Menú principal/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });

  it("handles missing location state gracefully", () => {
    useLocation.mockReturnValue({ state: {} });

    render(<FullScreenScoreWindow />);

    expect(screen.getByText("¡Partida Finalizada!")).toBeInTheDocument();
    // Verifica que al menos un "0" esté en la pantalla
    expect(screen.queryAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("Categoría: General")).toBeInTheDocument();
    expect(screen.getByText("Dificultad: Medio")).toBeInTheDocument();
  });

  it("handles zero total questions to avoid division by zero", () => {
    useLocation.mockReturnValue({
      state: {
        score: 0,
        correctAnswers: 0,
        totalQuestions: 0,
        streak: 0,
        timeTaken: 0,
        category: "TestCat",
        difficulty: "Fácil",
      },
    });

    render(<FullScreenScoreWindow />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("displays correct metrics when no correct answers", () => {
    useLocation.mockReturnValue({
      state: {
        score: 0,
        correctAnswers: 0,
        totalQuestions: 10,
        streak: 0,
        timeTaken: 100,
        category: "TestCat",
        difficulty: "Difícil",
      },
    });

    render(<FullScreenScoreWindow />);

    // Verifica que al menos un "0" esté en la pantalla
    expect(screen.queryAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.queryAllByText("10").length).toBeGreaterThan(0);

    expect(screen.queryAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getByText("10.0 seg")).toBeInTheDocument();
    expect(screen.getByTestId("CancelIcon")).toBeInTheDocument();
  });

  it("displays correct metrics when all answers are correct", () => {
    useLocation.mockReturnValue({
      state: {
        score: 100,
        correctAnswers: 10,
        totalQuestions: 10,
        streak: 10,
        timeTaken: 50,
        category: "TestCat",
        difficulty: "Fácil",
      },
    });

    render(<FullScreenScoreWindow />);

    // Verifica que al menos un "0" esté en la pantalla
    expect(screen.queryAllByText("0").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("100").length).toBeGreaterThan(0);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.queryAllByText("10").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("0").length).toBeGreaterThan(0);
  });
});
