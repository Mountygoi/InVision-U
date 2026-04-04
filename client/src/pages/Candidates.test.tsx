import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Candidates from './Candidates';

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Radar: () => <div />,
}));

// Mock search icon import
vi.mock('../assets/icons/search.svg', () => ({ default: 'search-icon.svg' }));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({
      data: [
        {
          id: '1',
          name: 'Test Candidate',
          email: 'test@test.com',
          university: 'Test School',
          city: 'Almaty',
          compositeScore: 80,
          achievementScore: 20,
          status: 'new',
          gpa: 3.5,
          achievements: [],
          skills: [],
          isRural: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
    })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

const renderCandidates = () => {
  return render(
    <MemoryRouter>
      <Candidates />
    </MemoryRouter>
  );
};

describe('Candidates — Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders status filter dropdown', async () => {
    renderCandidates();
    // The existing status filter is already there
    expect(await screen.findByText(/Все статусы/i)).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderCandidates();
    expect(await screen.findByPlaceholderText(/Поиск/i)).toBeInTheDocument();
  });

  it('renders score range filter', async () => {
    renderCandidates();
    expect(await screen.findByText(/Баллы/i)).toBeInTheDocument();
  });
});
