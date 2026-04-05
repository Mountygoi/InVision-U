import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

vi.mock('../assets/icons/logo.png', () => ({ default: 'logo.png' }));

import Landing from './Landing';

const renderLanding = () =>
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );

describe('Landing', () => {
  it('renders without crashing', () => {
    const { container } = renderLanding();
    expect(container).toBeTruthy();
  });

  it('displays the logo image', () => {
    renderLanding();
    const logo = screen.getByAltText('inVision U');
    expect(logo).toBeInTheDocument();
  });

  it('displays translation keys for buttons', () => {
    renderLanding();
    expect(screen.getByText('landingApply')).toBeInTheDocument();
    expect(screen.getByText('landingLogin')).toBeInTheDocument();
  });

  it('displays the subtitle translation key', () => {
    renderLanding();
    expect(screen.getByText('landingSubtitle')).toBeInTheDocument();
  });

  it('shows language toggle buttons', () => {
    renderLanding();
    expect(screen.getByText('RU')).toBeInTheDocument();
    expect(screen.getByText('KZ')).toBeInTheDocument();
  });
});
