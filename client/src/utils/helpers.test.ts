import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config', () => ({
  API_BASE: 'http://localhost:3000',
}));

import { getAvatarUrl, STATUS_COLORS } from './helpers';

describe('getAvatarUrl', () => {
  it('returns full server URL for /uploads/ paths', () => {
    const result = getAvatarUrl({ avatarUrl: '/uploads/avatar.jpg', name: 'Alice' });
    expect(result).toBe('http://localhost:3000/uploads/avatar.jpg');
  });

  it('returns external URL as-is', () => {
    const url = 'https://example.com/photo.png';
    const result = getAvatarUrl({ avatarUrl: url, name: 'Bob' });
    expect(result).toBe(url);
  });

  it('returns dicebear fallback when no avatarUrl', () => {
    const result = getAvatarUrl({ name: 'Charlie' });
    expect(result).toBe('https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie');
  });

  it('encodes special characters in dicebear seed', () => {
    const result = getAvatarUrl({ name: 'John Doe' });
    expect(result).toContain('seed=John%20Doe');
  });

  it('returns dicebear fallback for empty avatarUrl', () => {
    const result = getAvatarUrl({ avatarUrl: '', name: 'Eve' });
    expect(result).toBe('https://api.dicebear.com/7.x/avataaars/svg?seed=Eve');
  });
});

describe('STATUS_COLORS', () => {
  it('maps all expected statuses', () => {
    expect(STATUS_COLORS.new).toBe('blue');
    expect(STATUS_COLORS.under_review).toBe('orange');
    expect(STATUS_COLORS.interview).toBe('purple');
    expect(STATUS_COLORS.accepted).toBe('green');
    expect(STATUS_COLORS.declined).toBe('red');
    expect(STATUS_COLORS.waitlisted).toBe('gold');
    expect(STATUS_COLORS.arbitration).toBe('volcano');
  });

  it('returns undefined for unknown status', () => {
    expect(STATUS_COLORS['nonexistent']).toBeUndefined();
  });
});
