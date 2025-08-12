import { render, screen } from '@testing-library/react';

jest.mock('./lib/firebase', () => ({
  signInWithGoogle: jest.fn(),
  signInWithGitHub: jest.fn(),
  registerWithEmail: jest.fn(),
  signInWithEmail: jest.fn(),
  logOut: jest.fn(),
  auth: {}
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, callback) => {
    callback(null);
    return () => {};
  }
}));

import App from './App';

test('shows login button when not authenticated', () => {
  render(<App />);
  const buttonElement = screen.getByText(/登录/);
  expect(buttonElement).toBeInTheDocument();
});
