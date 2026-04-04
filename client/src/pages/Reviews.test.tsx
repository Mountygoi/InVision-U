import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Reviews from './Reviews';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({
      data: [
        {
          id: '1',
          name: 'Alice Tester',
          university: 'NIS Almaty',
          city: 'Almaty',
          compositeScore: 85,
          techScore: 80,
          softScore: 90,
          gpa: 3.8,
          ielts: 7.5,
          unt: 120,
          avatarUrl: null,
          status: 'under_review',
        },
        {
          id: '2',
          name: 'Bob Builder',
          university: 'NIS Astana',
          city: 'Astana',
          compositeScore: 72,
          techScore: 70,
          softScore: 74,
          gpa: 3.5,
          ielts: 7.0,
          unt: 110,
          avatarUrl: null,
          status: 'under_review',
        },
      ],
    })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

const renderReviews = () => {
  return render(
    <MemoryRouter>
      <Reviews />
    </MemoryRouter>
  );
};

describe('Reviews — List Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the "Committee Reviews" heading', async () => {
    renderReviews();
    expect(await screen.findByText(/Committee Reviews/i)).toBeInTheDocument();
  });

  it('renders candidate names in the list', async () => {
    renderReviews();
    expect(await screen.findByText('Alice Tester')).toBeInTheDocument();
    expect(screen.getByText('Bob Builder')).toBeInTheDocument();
  });

  it('renders filter controls', async () => {
    renderReviews();
    // Should have search, status filter, score range, city filter
    expect(await screen.findByPlaceholderText(/search/i)).toBeInTheDocument();
  });
});
