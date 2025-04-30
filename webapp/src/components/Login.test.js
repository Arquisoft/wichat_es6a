import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; // <--- IMPORTANTE
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Login from './Login';

const mockAxios = new MockAdapter(axios);

describe('Login component', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  const renderWithRouter = () =>
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

  it('should log in successfully', async () => {
    renderWithRouter();

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    mockAxios.onPost('http://localhost:8000/login').reply(200, {
      userId: '123',
      token: 'fake-token',
      createdAt: '2024-01-01T12:34:56Z',
    });

    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'testUser' } });
      fireEvent.change(passwordInput, { target: { value: 'testPassword' } });
      fireEvent.click(loginButton);
    });

    await waitFor(() =>
      expect(screen.getByText(/Login successful/i)).toBeInTheDocument()
    );
  });

  it('should handle error when logging in', async () => {
    renderWithRouter();

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    mockAxios
      .onPost('http://localhost:8000/login')
      .reply(401, { error: 'Unauthorized' });

    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    fireEvent.click(loginButton);

    await waitFor(() =>
      expect(screen.getByText(/Error: Unauthorized/i)).toBeInTheDocument()
    );
  });
});
