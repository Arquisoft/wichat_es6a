import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionHistoryWindow from "./QuestionHistoryWindow";

// Mock window.history.back
beforeAll(() => {
  jest.spyOn(window.history, "back").mockImplementation(() => {});
});
afterAll(() => {
  window.history.back.mockRestore();
});

describe("QuestionHistoryWindow Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra spinner mientras carga", () => {
    // Simula fetch que nunca resuelve
    global.fetch = jest.fn(() => new Promise(() => {}));
    render(<QuestionHistoryWindow />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("muestra mensaje de error si falla la petición", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
    render(<QuestionHistoryWindow />);
    expect(
      await screen.findByText(/Failed to fetch questions/i)
    ).toBeInTheDocument();
  });

  it("renderiza datos de usuario y lista de preguntas correctamente", async () => {
    const mockData = {
      username: "john_doe",
      dni: "12345678X",
      questions: [
        { question: "Q1", correctAnswer: "A1", isCorrect: true },
        { question: "Q2", correctAnswer: "A2", isCorrect: false },
      ],
      correctAnswers: 1,
      incorrectAnswers: 1,
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockData) })
    );

    render(<QuestionHistoryWindow />);

    // Datos de usuario
    expect(await screen.findByText(/Username: john_doe/i)).toBeInTheDocument();
    expect(screen.getByText(/DNI: 12345678X/i)).toBeInTheDocument();
    expect(screen.getByText(/Questions answered: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/^Correct answers:\s*1$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Incorrect answers:\s*1$/i)).toBeInTheDocument();

    // Pregunta correcta
    const q1 = screen.getByText("Q1");
    expect(q1).toBeInTheDocument();
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText(/Correct ✅/i)).toBeInTheDocument();

    // Verificar fondo verde en su Paper
    const paperQ1 = q1.closest(".MuiPaper-root");
    expect(paperQ1).toHaveStyle("background-color: #d4edda");

    // Pregunta incorrecta
    const q2 = screen.getByText("Q2");
    expect(q2).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText(/Incorrect ❌/i)).toBeInTheDocument();
  });

  it("llama a history.back al clicar Back", async () => {
    const mockData = {
      username: "john",
      dni: "123",
      questions: [],
      correctAnswers: 0,
      incorrectAnswers: 0,
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockData) })
    );

    render(<QuestionHistoryWindow />);
    // Espera a que desaparezca el spinner
    await waitFor(() =>
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    );

    const user = userEvent.setup();
    const backBtn = screen.getByRole("button", { name: /Back/i });
    await user.click(backBtn);
    expect(window.history.back).toHaveBeenCalled();
  });
});
