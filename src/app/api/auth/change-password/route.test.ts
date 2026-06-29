import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('bcryptjs')>();
  return { ...actual, hash: vi.fn(() => '$2a$10$hashedpassword') };
});

import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

describe('change-password API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no token', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'newpassword123' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('returns 400 for short password', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1' });
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'short' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('updates password when authorized with valid password', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1' });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1' });
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'newpassword123' }),
    });
    const response = await POST(req);
    const data = await response.json();
    expect(data).toEqual({ ok: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: expect.stringMatching(/^\$2a/), forcePasswordChange: false },
    });
  });
});
