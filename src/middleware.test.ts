import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

import { getToken } from 'next-auth/jwt';

async function runMiddleware(req: NextRequest) {
  const { middleware } = await import('./middleware');
  return middleware(req);
}

const mockToken = (
  overrides: Partial<{ role: string; forcePasswordChange: boolean }> = {},
) => ({
  sub: 'user-1',
  name: 'Test User',
  email: null,
  picture: null,
  role: 'ADMIN',
  forcePasswordChange: false,
  ...overrides,
});

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${pathname}`));
}

describe('middleware', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('allows public routes without token', async () => {
    const publicRoutes = ['/login', '/api/auth/session', '/api/health', '/api/seed'];

    for (const route of publicRoutes) {
      const response = await runMiddleware(makeRequest(route));
      expect(response?.status).not.toBe(302);
      expect(response?.headers.get('location')).toBeNull();
    }
  });

  it('redirects to login when unauthenticated accessing protected route', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await runMiddleware(makeRequest('/dashboard'));
    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('redirects non-admin away from admin routes', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken({ role: 'OPERATOR' }));
    const response = await runMiddleware(makeRequest('/admin'));
    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });

  it('redirects non-operator away from operator routes', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken({ role: 'ADMIN' }));
    const response = await runMiddleware(makeRequest('/operator'));
    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });

  it('allows admin to access admin routes', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken({ role: 'ADMIN' }));
    const response = await runMiddleware(makeRequest('/admin'));
    expect(response?.status).not.toBe(302);
  });

  it('allows operator to access operator routes', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken({ role: 'OPERATOR' }));
    const response = await runMiddleware(makeRequest('/operator'));
    expect(response?.status).not.toBe(302);
  });

  it('allows authenticated user on dashboard', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken({ role: 'ADMIN' }));
    const response = await runMiddleware(makeRequest('/dashboard'));
    expect(response?.status).not.toBe(302);
  });
});
