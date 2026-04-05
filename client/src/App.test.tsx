import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('./assets/icons/logo.png', () => ({ default: 'logo.png' }));
vi.mock('axios');

import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});
