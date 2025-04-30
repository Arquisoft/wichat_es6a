import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar'; 
import { BrowserRouter } from 'react-router-dom';

// Mock de localStorage
beforeEach(() => {
  jest.spyOn(Storage.prototype, 'getItem')
    .mockImplementation((key) => {
      if (key === 'username') return 'TestUser';
      if (key === '_id') return '123456';
      if (key === 'token') return 'fakeToken';
      return null;
    });
  jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();  // Limpiar mocks después de cada test
});

describe('Navbar', () => {
  
  test('renders navbar with basic buttons when no user is logged in', () => {
    // Simulamos un estado SIN usuario logueado
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'username') return null;  // No hay usuario
      return null;
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Comprobar los botones visibles
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Jugar')).toBeInTheDocument();
    expect(screen.getByText('Questions')).toBeInTheDocument();

    // Verificar que el botón 'Stats' no está visible
    expect(screen.queryByText('Stats')).not.toBeInTheDocument();

    // Verificar que el botón 'Logout' está visible
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('renders navbar with stats button and user options when user is logged in', () => {
    // Simulamos que hay un usuario logueado
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Comprobar los botones visibles
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Jugar')).toBeInTheDocument();
    expect(screen.getByText('Questions')).toBeInTheDocument();

    // Verificar que el botón 'Stats' está visible
    expect(screen.getByText('Stats')).toBeInTheDocument();

    // Verificar que el nombre de usuario 'TestUser' aparece en la barra de navegación
    expect(screen.getByText('TestUser')).toBeInTheDocument();

    // Hacer click en el nombre del usuario para abrir el menú
    const userButton = screen.getByText('TestUser');
    fireEvent.click(userButton);

    // Verificar que las opciones 'Configuración' y 'Logout' están en el menú
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
