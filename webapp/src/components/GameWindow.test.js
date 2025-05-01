import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import GameWindow from './GameWindow';
import Game from './Game';

import "@testing-library/jest-dom";
import { MemoryRouter } from 'react-router-dom';

jest.mock('./ChatClues', () => () => <div data-testid="mock-chatclues">Mock ChatClues</div>);
jest.mock('./QuestionTimer', () => () => <div data-testid="mock-questiontimer">Mock QuestionTimer</div>);


let sharedGame;

function createTestGame() {
  const game = new Game(() => {});
  game.TestingInit(2); // 1: París, 2: Cervantes
  game.init = async () => {}; // evitar sobrescritura en GameWindow
  return game;
}


beforeAll(() => {
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
    const game = createTestGame();
    render(
      <MemoryRouter initialEntries={['/game']}>
        <GameWindow gameInstance={game} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Cargando preguntas/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByText(/¿Cuál es la capital de Francia?/i).length).toBeGreaterThan(0)
    );
    
  });
  

  test('simula clic en respuesta correcta (París)', async () => {
    const game = createTestGame();
  
    render(
      <MemoryRouter>
        <GameWindow gameInstance={game} />
      </MemoryRouter>
    );
  
    // Esperamos a que aparezca la primera pregunta (cualquier botón con "París")
    await waitFor(() =>
      expect(
        screen.getAllByRole('button').some(btn => btn.textContent.includes('París'))
      ).toBe(true)
    );
  
    const correctButton = screen.getAllByRole('button').find(btn =>
      btn.textContent.includes('París')
    );
    expect(correctButton).toBeTruthy();
    fireEvent.click(correctButton);
    expect(correctButton).toHaveStyle('background-color: #a5d6a7');
  
    // Esperamos a que avance de pregunta: misma pregunta, nuevos botones
    await waitFor(() => expect(correctButton).toBeDisabled());

  });
  
  
  test('simula clic en respuesta incorrecta (Madrid)', async () => {
    const game = createTestGame();
  
    render(
      <MemoryRouter>
        <GameWindow gameInstance={game} />
      </MemoryRouter>
    );
  
    await waitFor(() =>
      expect(
        screen.getAllByRole('button').some(btn => btn.textContent.includes('Madrid'))
      ).toBe(true)
    );
  
    const wrongButton = screen.getAllByRole('button').find(btn =>
      btn.textContent.includes('Madrid')
    );
    expect(wrongButton).toBeTruthy();
    fireEvent.click(wrongButton);
    expect(wrongButton).toHaveStyle('background-color: #ef9a9a');
  });
  
  test('aplica correctamente el comodín 50/50', async () => {
    const game = createTestGame();
  
    render(
      <MemoryRouter>
        <GameWindow gameInstance={game} />
      </MemoryRouter>
    );
  
    await waitFor(() =>
      expect(
        screen.getAllByRole('button').some(btn => btn.textContent.includes('París'))
      ).toBe(true)
    );
  
    const fiftyFiftyButton = screen.getByText(/50\s*\/\s*50/i); // Busca el botón "50 / 50"
    expect(fiftyFiftyButton).toBeInTheDocument();
  
    fireEvent.click(fiftyFiftyButton);
  
    // Esperar que solo queden dos opciones activas (una correcta y una incorrecta)
    await waitFor(() => {
      const activeAnswerButtons = screen
        .getAllByRole('button')
        .filter(btn =>
          ['Madrid', 'París', 'Berlín', 'Lisboa'].some(txt => btn.textContent.includes(txt)) &&
          !btn.disabled
        );
      expect(activeAnswerButtons.length).toBe(2);
    });
  });
  
  test('el botón de 50/50 se deshabilita después de usarse', async () => {
    const game = createTestGame();
  
    render(
      <MemoryRouter>
        <GameWindow gameInstance={game} />
      </MemoryRouter>
    );
  
    // Esperamos a que el botón esté visible
    const fiftyButton = await screen.findByRole('button', { name: /50\s*\/\s*50/i });
    expect(fiftyButton).toBeEnabled();
  
    // Click en 50/50
    fireEvent.click(fiftyButton);
  
    // Verificamos que se desactiva
    expect(fiftyButton).toBeDisabled();
  
    // OPCIONAL: si tu lógica oculta respuestas, puedes verificar que solo haya 2 visibles
    const visibleAnswers = screen.getAllByRole('button').filter(btn =>
      ['Madrid', 'París', 'Berlín', 'Lisboa'].some(txt => btn.textContent.includes(txt))
    );
  
  });

  test('no permite usar el 50/50 más de una vez', async () => {
    const game = createTestGame();
    render(
      <MemoryRouter>
        <GameWindow gameInstance={game} />
      </MemoryRouter>
    );
  
    const fiftyButton = await screen.findByRole('button', { name: /50\s*\/\s*50/i });
    fireEvent.click(fiftyButton);
  
    // Guardamos las respuestas visibles tras usar el comodín
    const reducedAnswers = screen.getAllByRole('button').filter(btn =>
      ['Madrid', 'París', 'Berlín', 'Lisboa'].some(txt => btn.textContent.includes(txt))
    );
  
    // Intentamos hacer clic de nuevo
    fireEvent.click(fiftyButton);
  
    // Comprobamos que siguen siendo las mismas respuestas visibles
    const answersAfterSecondClick = screen.getAllByRole('button').filter(btn =>
      ['Madrid', 'París', 'Berlín', 'Lisboa'].some(txt => btn.textContent.includes(txt))
    );
  
    expect(answersAfterSecondClick.length).toBe(reducedAnswers.length);
  });
  
  


});
