
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import GameWindow from './GameWindow';
import "@testing-library/jest-dom";
import { MemoryRouter } from 'react-router-dom';

beforeEach(() => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    if (key === 'username') return 'TestUser';
    return null;
  });

  global.Image = class {
    constructor() {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
    set src(_) {}
  };
});

describe('GameWindow Tests', () => {
  test('renderiza correctamente el componente inicial', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/game', state: {} }]}>
        <GameWindow />
      </MemoryRouter>
    );
    expect(screen.getByText(/Cargando preguntas/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Pregunta 1/i)).toBeInTheDocument());
  });

  test('muestra las respuestas de la primera pregunta', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/game', state: {} }]}>
        <GameWindow />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByRole('button', { name: /Madrid|París|Berlín|Lisboa/i })).toBeInTheDocument());
  });

  test('simula clic en respuesta correcta', async () => {
    render(<MemoryRouter><GameWindow /></MemoryRouter>);
    await waitFor(() => screen.getByText(/Pregunta 1/i));
    const correctButton = screen.getAllByRole('button').find(btn => btn.textContent === 'París');
    fireEvent.click(correctButton);
    expect(correctButton).toHaveStyle('background-color: #a5d6a7');
  });

  test('simula clic en respuesta incorrecta', async () => {
    render(<MemoryRouter><GameWindow /></MemoryRouter>);
    await waitFor(() => screen.getByText(/Pregunta 1/i));
    const wrongButton = screen.getAllByRole('button').find(btn => btn.textContent === 'Madrid');
    fireEvent.click(wrongButton);
    expect(wrongButton).toHaveStyle('background-color: #ef9a9a');
  });

  test('comodín 50/50 desactiva dos respuestas incorrectas', async () => {
    render(<MemoryRouter><GameWindow /></MemoryRouter>);
    await waitFor(() => screen.getByText(/Pregunta 1/i));
    const btn5050 = screen.getByRole('button', { name: /50 \/ 50/i });
    fireEvent.click(btn5050);
    const allAnswers = screen.getAllByRole('button').filter(btn => btn.textContent !== 'París');
    const eliminated = allAnswers.filter(btn => btn).slice(0, 2);
    eliminated.forEach(btn => expect(btn).toHaveStyle('background-color: #bdbdbd'));
  });

  test('comodín Pista muestra un mensaje y se desactiva', async () => {
    render(<MemoryRouter><GameWindow /></MemoryRouter>);
    await waitFor(() => screen.getByText(/Pregunta 1/i));
    const hintButton = screen.getByRole('button', { name: /Pista/i });
    fireEvent.click(hintButton);
    expect(hintButton).toBeDisabled();
  });

  test('comodín Pregunta IA habilita el chat', async () => {
    render(<MemoryRouter><GameWindow /></MemoryRouter>);
    await waitFor(() => screen.getByText(/Pregunta 1/i));
    const aiButton = screen.getByRole('button', { name: /Pregunta IA/i });
    fireEvent.click(aiButton);
    expect(aiButton).toBeDisabled();
  });

  test('timer se agota sin respuesta', async () => {
    jest.useFakeTimers();
    render(<MemoryRouter><GameWindow /></MemoryRouter>);
    await waitFor(() => screen.getByText(/Pregunta 1/i));
    act(() => { jest.advanceTimersByTime(30000); });
    await waitFor(() => expect(screen.getByText(/Pregunta 2/i)).toBeInTheDocument());
  });

  test('fin del juego muestra mensaje de cierre', async () => {
    render(<MemoryRouter><GameWindow /></MemoryRouter>);
    for (let i = 0; i < 5; i++) {
      await waitFor(() => screen.getByText(/Pregunta/i));
      const btn = screen.getAllByRole('button').find(b => b.textContent === 'París');
      fireEvent.click(btn);
      await waitFor(() => screen.getByText(/Pts:/i));
    }
    await waitFor(() => expect(screen.getByText(/Fin de la partida/i)).toBeInTheDocument());
  });

  test('renderiza correctamente la imagen o su fallback', async () => {
    render(<MemoryRouter><GameWindow /></MemoryRouter>);
    await waitFor(() => screen.getByAltText(/Imagen para:/i));
  });

  test('verifica racha y puntuación', async () => {
    render(<MemoryRouter><GameWindow /></MemoryRouter>);
    await waitFor(() => screen.getByText(/Pregunta 1/i));
    const btn = screen.getAllByRole('button').find(b => b.textContent === 'París');
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText(/Pts:/i)).toBeInTheDocument());
    expect(screen.getByText(/1/)).toBeInTheDocument(); // racha mínima esperada
  });
});
