import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AllQuestionsWindow from "./AllQuestionsWindow";

// Mock global.fetch antes de ejecutar los tests
beforeAll(() => {
  global.fetch = jest.fn();
});
afterAll(() => {
  delete global.fetch;
});
afterEach(() => {
  jest.resetAllMocks();
});

describe("AllQuestionsWindow component", () => {
  it("muestra el spinner y luego renderiza la lista de preguntas al obtener datos correctamente", async () => {
    const mockQuestions = [
      {
        _id: "q1",
        question: "¿Cuál es la capital de España?",
        correctAnswer: "Madrid",
        incorrectAnswers: ["Barcelona", "Valencia", "Sevilla"],
      },
      {
        _id: "q2",
        question: "¿Qué planeta es conocido como el planeta rojo?",
        correctAnswer: "Marte",
        incorrectAnswers: ["Júpiter", "Saturno", "Venus"],
      },
    ];

    // Simula un fetch exitoso que devuelve un array de preguntas
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuestions),
    });

    render(<AllQuestionsWindow />);

    // Mientras carga, debe verse el spinner
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Esperamos a que aparezca el encabezado con "Listado de Preguntas"
    expect(
      await screen.findByRole("heading", { name: /Listado de Preguntas/i })
    ).toBeInTheDocument();

    // Verificamos que cada pregunta y sus respuestas (correcta e incorrectas) estén en pantalla
    for (const q of mockQuestions) {
      expect(screen.getByText(q.question)).toBeInTheDocument();
      expect(screen.getByText(q.correctAnswer)).toBeInTheDocument();
      for (const wrong of q.incorrectAnswers) {
        expect(screen.getByText(wrong)).toBeInTheDocument();
      }
    }

    // Aseguramos que fetch fue llamado exactamente una vez
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("muestra un Alert con el mensaje de error si fetch devuelve ok: false", async () => {
    // Simula un fetch con status 500
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<AllQuestionsWindow />);

    // Spinner inicial
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Esperamos al Alert de error
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Error fetching questions:/i);
    // Ahora comprobamos que incluye el código de estado 500
    expect(alert).toHaveTextContent(/status: 500/i);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("muestra un Alert si la respuesta JSON no es un array", async () => {
    // Simula un fetch ok pero retorno no-array
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ foo: "bar" }),
    });

    render(<AllQuestionsWindow />);

    // Esperamos al Alert de "Invalid data format"
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      /Invalid data format received from server/i
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("muestra un Alert si la llamada a fetch lanza excepción", async () => {
    // Simula fetch rechazado
    fetch.mockRejectedValueOnce(new Error("Network failure"));

    render(<AllQuestionsWindow />);

    // Esperamos al Alert con el mensaje de la excepción
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      /Error fetching questions: Network failure/i
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
