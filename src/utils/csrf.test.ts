import { describe, expect, it } from 'vitest';
import { createCsrfToken, getCsrfTokenFromRequest } from './csrf';

describe('CSRF helpers', () => {
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
