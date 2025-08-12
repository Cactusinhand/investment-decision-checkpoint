import { render, screen } from '@testing-library/react';
import { translations } from './constants';

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

test('shows login button and reminder when not authenticated', () => {
  render(<App />);
  const buttonElement = screen.getByTestId('login-button');
  expect(buttonElement).toBeInTheDocument();
  const reminder = screen.getByText(translations.zh.loginReminder);
  expect(reminder).toBeInTheDocument();
});
