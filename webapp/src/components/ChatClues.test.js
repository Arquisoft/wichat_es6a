import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ChatClues from "./ChatClues";
import axios from "axios";

jest.mock("axios");

const mockQuestion = "¿Cuál es la capital de Francia?";
const mockAnswers = ["Madrid", "Berlín", "París", "Londres"];

const setup = () => {
  const ref = React.createRef();
  render(
    <ChatClues ref={ref} actualQuestion={mockQuestion} answers={mockAnswers} />
  );
  return { ref };
};

describe("ChatClues component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders initial instruction message", () => {
    setup();
    expect(
      screen.getByText(
        /Pulsa 'Pista' o 'Pregunta IA' para activar el asistente/i
      )
    ).toBeInTheDocument();
  });

  it("does not render input or send button when chat is disabled", () => {
    setup();
    const input = screen.queryByPlaceholderText("Escribe aquí...");
    const button = screen.queryByRole("button", { name: /send/i });

    expect(input).not.toBeInTheDocument();
    expect(button).not.toBeInTheDocument();
  });

  it("enables chat and allows user input and message send", async () => {
    const { ref } = setup();

    act(() => {
      ref.current.enableChat();
    });

    const input = screen.getByPlaceholderText("Escribe aquí...");
    const button = screen.getByRole("button", { name: /send/i });

    expect(input).toBeEnabled();
    expect(button).toBeEnabled();

    fireEvent.change(input, { target: { value: "¿Es París la capital?" } });
    expect(input.value).toBe("¿Es París la capital?");

    axios.post.mockResolvedValueOnce({
      data: { hint: "Sí, París es la capital." },
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText(/Tú: ¿Es París la capital\?/)).toBeInTheDocument();
    expect(
      screen.getByText(/IA: Sí, París es la capital\./)
    ).toBeInTheDocument();
  });

  it("handles API error response gracefully", async () => {
    const { ref } = setup();
    act(() => {
      ref.current.enableChat();
    });

    fireEvent.change(screen.getByPlaceholderText("Escribe aquí..."), {
      target: { value: "¿Es Madrid la capital?" },
    });

    axios.post.mockRejectedValueOnce({ response: { status: 500 } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
    });

    expect(screen.getByText(/Error del servidor \(500\)/)).toBeInTheDocument();
  });

  it("handles API no response error", async () => {
    const { ref } = setup();
    act(() => {
      ref.current.enableChat();
    });

    fireEvent.change(screen.getByPlaceholderText("Escribe aquí..."), {
      target: { value: "Hola" },
    });

    axios.post.mockRejectedValueOnce({ request: {} });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
    });

    expect(screen.getByText(/Sin respuesta del servidor/)).toBeInTheDocument();
  });

  it("can disable chat and reset to initial instruction", () => {
    const { ref } = setup();
    act(() => {
      ref.current.enableChat();
      ref.current.disableChat();
    });

    expect(
      screen.getByText(/Pulsa 'Pista' o 'Pregunta IA'/i)
    ).toBeInTheDocument();
    const input = screen.queryByPlaceholderText("Escribe aquí...");
    const button = screen.queryByRole("button", { name: /send/i });
    expect(input).not.toBeInTheDocument();
    expect(button).not.toBeInTheDocument();
  });

  it("can add a message programmatically", () => {
    const { ref } = setup();
    act(() => {
      ref.current.addMessage("IA: Este es un mensaje agregado.");
    });

    // Message is added
    expect(screen.getByText(/Este es un mensaje agregado/)).toBeInTheDocument();

    // Chat becomes visible, input and button should be present but disabled
    const input = screen.getByPlaceholderText("Escribe aquí...");
    const button = screen.getByRole("button", { name: /send/i });
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });
});
