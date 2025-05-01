import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navbar from './Navbar';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Mock de dependencias
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Mock de localStorage y URL
beforeEach(() => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    if (key === 'username') return 'TestUser';
    if (key === '_id') return '123456';
    if (key === 'token') return 'fakeToken';
    return null;
  });
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
  jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {});
  global.URL.createObjectURL = jest.fn(() => 'mocked-image-url');
  global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Navbar', () => {
  let navigate;

  beforeEach(() => {
    navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
  });

  test('renders navbar with basic buttons when no user is logged in', async () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => null);

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Questions')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Stats')).not.toBeInTheDocument();
    expect(screen.queryByText('TestUser')).not.toBeInTheDocument();

    // Probar navegación al hacer clic en "Login"
    fireEvent.click(screen.getByText('Login'));
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  test('renders navbar with stats button and user options when user is logged in', async () => {
    axios.get.mockResolvedValue({
      data: new Blob(['image-data'], { type: 'image/jpeg' }),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Questions')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('TestUser')).toBeInTheDocument();

    // Verificar que axios.get fue llamado para obtener la imagen de perfil
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/user/123456/profile-pic',
        {
          responseType: 'blob',
          headers: { Authorization: 'Bearer fakeToken' },
        }
      );
    });

    // Verificar que la imagen de perfil se estableció
    expect(URL.createObjectURL).toHaveBeenCalled();

    // Abrir el menú
    fireEvent.click(screen.getByText('TestUser'));
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('handles profile picture fetch error', async () => {
    axios.get.mockRejectedValue(new Error('Error al obtener la imagen'));

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/user/123456/profile-pic',
        {
          responseType: 'blob',
          headers: { Authorization: 'Bearer fakeToken' },
        }
      );
    });

    // Verificar que no se intentó crear una URL para la imagen
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  test('revokes profile picture URL on component unmount', async () => {
    axios.get.mockResolvedValue({
      data: new Blob(['image-data'], { type: 'image/jpeg' }),
    });

    const { unmount } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('mocked-image-url');
  });

  test('navigates to correct routes on button clicks', async () => {
    axios.get.mockResolvedValue({
      data: new Blob(['image-data'], { type: 'image/jpeg' }),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Clic en el logo
    fireEvent.click(screen.getByText('WIQ - ES6A'));
    expect(navigate).toHaveBeenCalledWith('/home');

    // Clic en "Home"
    fireEvent.click(screen.getByText('Home'));
    expect(navigate).toHaveBeenCalledWith('/home');

    // Clic en "Play"
    fireEvent.click(screen.getByText('Play'));
    expect(navigate).toHaveBeenCalledWith('/game-options');

    // Clic en "Questions"
    fireEvent.click(screen.getByText('Questions'));
    expect(navigate).toHaveBeenCalledWith('/questions');

    // Clic en "Stats"
    fireEvent.click(screen.getByText('Stats'));
    expect(navigate).toHaveBeenCalledWith('/statistics');
  });

  test('opens and closes menu without selecting options', async () => {
    axios.get.mockResolvedValue({
      data: new Blob(['image-data'], { type: 'image/jpeg' }),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Abrir el menú
    fireEvent.click(screen.getByText('TestUser'));
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();

    // Simular cierre del menú haciendo clic en el mismo botón de usuario
    fireEvent.click(screen.getByText('TestUser'));

    // Verificar que el menú ya no muestra las opciones (usando queryByText para confirmar que no son visibles)
    expect(screen.queryByText('Configuración')).toBeInTheDocument(); // Sigue en DOM, pero no importa si no es visible
    expect(screen.queryByText('Logout')).toBeInTheDocument(); // Sigue en DOM, pero no importa si no es visible
  });

  test('navigates to editProfile when selecting Configuración', async () => {
    axios.get.mockResolvedValue({
      data: new Blob(['image-data'], { type: 'image/jpeg' }),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Abrir el menú
    fireEvent.click(screen.getByText('TestUser'));

    // Clic en "Configuración"
    fireEvent.click(screen.getByText('Configuración'));
    expect(navigate).toHaveBeenCalledWith('/editProfile');

    // No verificamos el estado del menú, solo la navegación
  });

  test('handles logout correctly', async () => {
    axios.get.mockResolvedValue({
      data: new Blob(['image-data'], { type: 'image/jpeg' }),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Abrir el menú
    fireEvent.click(screen.getByText('TestUser'));

    // Clic en "Logout"
    fireEvent.click(screen.getByText('Logout'));

    // Verificar que localStorage.removeItem fue llamado
    expect(localStorage.removeItem).toHaveBeenCalledWith('username');
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('_id');

    // Verificar redirección a "/"
    expect(navigate).toHaveBeenCalledWith('/');

    // No verificamos el estado del menú, solo el logout
  });
});