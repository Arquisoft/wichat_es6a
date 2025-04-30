import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ChatClues from "./ChatClues";
import axios from "axios";

jest.mock("axios");

const mockQuestion = "¿Cuál es la capital de Francia?";
const mockAnswers = ["Madrid", "Berlín", "París", "Londres"];

const setup = () => {
  const ref = React.createRef();
  render(<ChatClues ref={ref} actualQuestion={mockQuestion} answers={mockAnswers} />);
  return { ref };
};

describe("ChatClues component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders initial message", () => {
    setup();
    expect(screen.getByText(/¿En qué puedo ayudarte/i)).toBeInTheDocument();
  });

  it("does not allow input or button when chat is disabled", () => {
    setup();
    const input = screen.getByPlaceholderText("Escribe aquí...");
    const button = screen.getByRole("button", { name: /send/i });

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it("enables chat and allows user input and message send", async () => {
    const { ref } = setup();

    // Enable chat
    act(() => {
      ref.current.enableChat();
    });

    const input = screen.getByPlaceholderText("Escribe aquí...");
    const button = screen.getByRole("button", { name: /send/i });

    expect(input).toBeEnabled();
    expect(button).toBeEnabled();

    // Simulate user typing
    fireEvent.change(input, { target: { value: "¿Es París la capital?" } });
    expect(input.value).toBe("¿Es París la capital?");

    // Mock API success response
    axios.post.mockResolvedValueOnce({
      data: { hint: "Sí, París es la capital." },
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText(/Tú: ¿Es París la capital\?/)).toBeInTheDocument();
    expect(screen.getByText(/IA: Sí, París es la capital./)).toBeInTheDocument();
  });

  it("handles API error response gracefully", async () => {
    const { ref } = setup();
    act(() => {
      ref.current.enableChat();
    });

    const input = screen.getByPlaceholderText("Escribe aquí...");
    fireEvent.change(input, { target: { value: "¿Es Madrid la capital?" } });

    axios.post.mockRejectedValueOnce({
      response: { status: 500 },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
    });

    expect(screen.getByText(/Error del servidor: 500/)).toBeInTheDocument();
  });

  it("handles API no response error", async () => {
    const { ref } = setup();
    act(() => {
      ref.current.enableChat();
    });

    fireEvent.change(screen.getByPlaceholderText("Escribe aquí..."), {
      target: { value: "Hola" },
    });

    axios.post.mockRejectedValueOnce({
      request: {},
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
    });

    expect(screen.getByText(/Sin respuesta del servidor/)).toBeInTheDocument();
  });

  it("can disable chat and reset messages", () => {
    const { ref } = setup();
    act(() => {
      ref.current.enableChat();
      ref.current.disableChat();
    });

    expect(screen.getByText(/¿En qué puedo ayudarte/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Escribe aquí...")).toBeDisabled();
  });

  it("can add a message programmatically", () => {
    const { ref } = setup();
    act(() => {
      ref.current.addMessage("IA: Este es un mensaje agregado.");
    });

    expect(screen.getByText(/Este es un mensaje agregado/)).toBeInTheDocument();
  });
});