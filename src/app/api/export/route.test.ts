import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    registration: {
      findMany: vi.fn(),
    },
  },
}));

import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

describe('export API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 for non-admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'OPERATOR' });
    const { GET } = await import('./route');
    const req = new Request('http://localhost:3000/api/export');
    const response = await GET(req);
    expect(response.status).toBe(403);
  });

  it('returns xlsx file for admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'ADMIN' });
    (prisma.registration.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { firstName: 'John', lastName: 'Doe', nationalId: '1111111111', operator: { fullname: 'Op' }, createdAt: new Date('2026-01-01') },
    ]);
    const { GET } = await import('./route');
    const req = new Request('http://localhost:3000/api/export');
    const response = await GET(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="registrations.xlsx"');
  });
});
