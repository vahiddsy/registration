import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCsrfToken, getCsrfTokenFromRequest } from '@/utils/csrf';

const findUnique = vi.fn();
const update = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique, update } } }));

describe('auth helpers', () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
  });

  it('creates a non-empty CSRF token', () => {
    const token = createCsrfToken();
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(20);
  });

  it('reads a CSRF token from request headers', () => {
    const req = new Request('https://example.com', { headers: { 'x-csrf-token': 'abc123' } });
    expect(getCsrfTokenFromRequest(req)).toBe('abc123');
  });
});
