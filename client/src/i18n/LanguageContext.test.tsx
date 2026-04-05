import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useLanguage } from './LanguageContext';

beforeEach(() => {
  localStorage.clear();
});

const TestConsumer = () => {
  const { lang, setLang, t } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="translated">{t('loading')}</span>
      <span data-testid="missing">{t('nonexistent_key')}</span>
      <button onClick={() => setLang('kz')}>Switch to KZ</button>
    </div>
  );
};

describe('LanguageProvider', () => {
  it('defaults to ru', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe('ru');
  });

  it('translates known keys', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('translated').textContent).toBe('Загрузка...');
  });

  it('returns the key itself for missing translations', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('missing').textContent).toBe('nonexistent_key');
  });

  it('switches language on setLang', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );
    await user.click(screen.getByText('Switch to KZ'));
    expect(screen.getByTestId('lang').textContent).toBe('kz');
  });

  it('persists language in localStorage', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );
    await user.click(screen.getByText('Switch to KZ'));
    expect(localStorage.getItem('lang')).toBe('kz');
  });

  it('reads initial language from localStorage', () => {
    localStorage.setItem('lang', 'kz');
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe('kz');
  });
});
