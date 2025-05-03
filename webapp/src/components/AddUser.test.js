import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import AddUser from './AddUser';

// Mock external dependencies
jest.mock('axios');

jest.mock('@mui/material', () => ({
  Container: ({ children, maxWidth, sx }) => (
    <div data-testid={`container-${maxWidth}`} style={{ marginTop: sx?.marginTop }}>
      {children}
    </div>
  ),
  Typography: ({ children, component, variant, align, sx }) => (
    <div
      data-testid={`typography-${component}-${variant}`}
      style={{ textAlign: align, marginBottom: sx?.marginBottom }}
    >
      {children}
    </div>
  ),
  TextField: ({ name, label, value, onChange, type, fullWidth, margin, sx }) => (
    <input
      data-testid={`textfield-${name}`}
      name={name}
      value={value}
      onChange={onChange}
      type={type}
      placeholder={label}
      style={{ marginBottom: sx?.marginBottom }}
    />
  ),
  Button: ({ children, onClick, variant, color }) => (
    <button
      data-testid={`button-${variant}-${color}`}
      onClick={onClick}
    >
      {children}
    </button>
  ),
  Snackbar: ({ open, message, onClose, autoHideDuration }) => (
    open ? (
      <div
        data-testid="snackbar"
        data-message={message}
        onClick={onClose}
      >
        {message}
      </div>
    ) : null
  ),
  Box: ({ children, sx }) => (
    <div data-testid="box" style={{ display: sx?.display, flexDirection: sx?.flexDirection, gap: sx?.gap }}>
      {children}
    </div>
  ),
}));

describe('AddUser Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Add User title', () => {
    render(<AddUser />);
    expect(screen.getByTestId('typography-h1-h5')).toHaveTextContent('Add User');
  });

  test('renders username and password input fields', () => {
    render(<AddUser />);
    expect(screen.getByTestId('textfield-username')).toBeInTheDocument();
    expect(screen.getByTestId('textfield-password')).toBeInTheDocument();
    expect(screen.getByTestId('textfield-password')).toHaveAttribute('type', 'password');
  });

  test('renders Add User button', () => {
    render(<AddUser />);
    expect(screen.getByTestId('button-contained-primary')).toHaveTextContent('Add User');
  });

  test('updates username and password inputs on change', () => {
    render(<AddUser />);
    const usernameInput = screen.getByTestId('textfield-username');
    const passwordInput = screen.getByTestId('textfield-password');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('testpass');
  });

  test('calls axios.post and shows success Snackbar on successful add', async () => {
    axios.post.mockResolvedValue({ data: {} });
    render(<AddUser />);

    const usernameInput = screen.getByTestId('textfield-username');
    const passwordInput = screen.getByTestId('textfield-password');
    const button = screen.getByTestId('button-contained-primary');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:8000/adduser', {
        username: 'testuser',
        password: 'testpass',
      });
      expect(screen.getByTestId('snackbar')).toHaveAttribute('data-message', 'User added successfully');
    });
  });

  test('shows error Snackbar on failed add', async () => {
    axios.post.mockRejectedValue({
      response: { data: { error: 'Username already exists' } },
    });
    render(<AddUser />);

    const usernameInput = screen.getByTestId('textfield-username');
    const passwordInput = screen.getByTestId('textfield-password');
    const button = screen.getByTestId('button-contained-primary');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:8000/adduser', {
        username: 'testuser',
        password: 'testpass',
      });
      expect(screen.getByTestId('snackbar')).toHaveAttribute('data-message', 'Error: Username already exists');
    });
  });

  test('closes success Snackbar when clicked', async () => {
    axios.post.mockResolvedValue({ data: {} });
    render(<AddUser />);

    const button = screen.getByTestId('button-contained-primary');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('snackbar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('snackbar'));

    await waitFor(() => {
      expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
    });
  });

  test('closes error Snackbar when clicked', async () => {
    axios.post.mockRejectedValue({
      response: { data: { error: 'Username already exists' } },
    });
    render(<AddUser />);

    const button = screen.getByTestId('button-contained-primary');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('snackbar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('snackbar'));

    await waitFor(() => {
      expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
    });
  });
});