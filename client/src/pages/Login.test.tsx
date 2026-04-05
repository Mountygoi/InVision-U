import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../i18n/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    lang: 'ru' as const,
    setLang: vi.fn(),
  }),
}));

vi.mock('../i18n/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light' as const,
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('axios');

vi.mock('../config', () => ({
  API_BASE: 'http://localhost:3000',
  API: 'http://localhost:3000/api',
}));

import Login from './Login';

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

describe('Login', () => {
  it('renders without crashing', () => {
    const { container } = renderLogin();
    expect(container).toBeTruthy();
  });

  it('displays the login title', () => {
    renderLogin();
    expect(screen.getByText('candidateLogin')).toBeInTheDocument();
  });

  it('displays the login subtitle', () => {
    renderLogin();
    expect(screen.getByText('loginSubtitle')).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('emailPlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('passwordPlaceholder')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderLogin();
    expect(screen.getByText('signIn')).toBeInTheDocument();
  });

  it('renders the apply link', () => {
    renderLogin();
    expect(screen.getByText('applyNow')).toBeInTheDocument();
  });
});
