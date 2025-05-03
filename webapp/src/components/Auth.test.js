import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Auth from './Auth';

// Mock external dependencies
jest.mock('@mui/material', () => ({
  Container: ({ children, maxWidth }) => (
    <div data-testid={`container-${maxWidth}`}>{children}</div>
  ),
  Typography: ({ children, component, variant, align, sx }) => (
    <div
      data-testid={`typography-${component}-${variant}`}
      style={{ textAlign: align, marginTop: sx?.marginTop || 0 }}
    >
      {children}
    </div>
  ),
  Link: ({ children, component, variant, onClick }) => (
    <button
      data-testid={`link-${component}-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  ),
  CssBaseline: () => null,
  Box: ({ children, sx, 'data-testid': testId }) => (
    <div
      data-testid={testId || 'box'}
      style={{
        marginTop: sx?.marginTop,
        minHeight: sx?.minHeight,
        position: sx?.position,
        width: sx?.width,
      }}
    >
      {children}
    </div>
  ),
  Fade: ({ children, in: inProp, unmountOnExit }) => (
    inProp ? (
      <div data-testid={`fade-${inProp}`}>{children}</div>
    ) : unmountOnExit ? null : (
      <div data-testid={`fade-${inProp}`} style={{ display: 'none' }}>
        {children}
      </div>
    )
  ),
}));

jest.mock('./Login', () => () => <div data-testid="login-component">Login</div>);
jest.mock('./AddUser', () => () => <div data-testid="adduser-component">AddUser</div>);

describe('Auth Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders welcome message', () => {
    render(<Auth />);
    expect(screen.getByTestId('typography-h1-h5')).toHaveTextContent(
      'Welcome to the 2025 edition of the Software Architecture course'
    );
  });

  test('initially renders Login component and not AddUser', () => {
    render(<Auth />);
    expect(screen.getByTestId('login-component')).toBeInTheDocument();
    expect(screen.queryByTestId('adduser-component')).not.toBeInTheDocument();
  });

  test('displays "Register here" link when showing Login', () => {
    render(<Auth />);
    expect(screen.getByTestId('link-button-body2')).toHaveTextContent(
      "Don't have an account? Register here."
    );
  });

  test('toggles to AddUser component when link is clicked', () => {
    render(<Auth />);
    const link = screen.getByTestId('link-button-body2');
    fireEvent.click(link);
    expect(screen.getByTestId('adduser-component')).toBeInTheDocument();
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument();
    expect(screen.getByTestId('link-button-body2')).toHaveTextContent(
      'Already have an account? Login here.'
    );
  });

  test('toggles back to Login component when link is clicked again', () => {
    render(<Auth />);
    const link = screen.getByTestId('link-button-body2');
    fireEvent.click(link); // Show AddUser
    fireEvent.click(link); // Show Login
    expect(screen.getByTestId('login-component')).toBeInTheDocument();
    expect(screen.queryByTestId('adduser-component')).not.toBeInTheDocument();
    expect(screen.getByTestId('link-button-body2')).toHaveTextContent(
      "Don't have an account? Register here."
    );
  });
});