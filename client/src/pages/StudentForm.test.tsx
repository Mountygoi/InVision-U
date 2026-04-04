import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StudentForm from './StudentForm';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: { id: 'test-id', tempPassword: 'ABC123' } })),
    get: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      loading: vi.fn(),
    },
  };
});

const renderForm = () => {
  return render(
    <MemoryRouter>
      <StudentForm />
    </MemoryRouter>
  );
};

describe('StudentForm — Contact Method', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a contact method selector (Telegram/Instagram/WhatsApp)', () => {
    renderForm();
    expect(screen.getByText(/Preferred Contact Method/i)).toBeInTheDocument();
  });

  it('renders a contact handle input field', () => {
    renderForm();
    expect(screen.getByText(/Contact Handle/i)).toBeInTheDocument();
  });
});

describe('StudentForm — School Dropdown (No University/GPA)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT render a university text input', () => {
    renderForm();
    // The old field had label "University / School" — it should no longer exist
    expect(screen.queryByText(/University \/ School/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/University/i)).not.toBeInTheDocument();
  });

  it('does NOT render a GPA field', () => {
    renderForm();
    expect(screen.queryByText('GPA')).not.toBeInTheDocument();
  });

  it('renders a school dropdown with Kazakhstan schools', () => {
    renderForm();
    // Should have a "School" label (the form field label is wrapped in <strong>)
    const schoolLabels = screen.getAllByText(/School/i);
    // At least one should be the form label
    expect(schoolLabels.length).toBeGreaterThanOrEqual(1);
    // Specifically check the "Please select your school" placeholder exists through the Select
    expect(screen.getByText(/Select your school/i)).toBeInTheDocument();
  });
});
