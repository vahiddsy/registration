import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }));
vi.mock('@/services/registration-service', () => ({ removeRegistration: vi.fn() }));

import { getToken } from 'next-auth/jwt';
import { removeRegistration } from '@/services/registration-service';

const mockToken = (overrides: Record<string, unknown> = {}) => ({
  sub: 'admin-1',
  role: 'ADMIN',
  ...overrides,
});

function makeRequest(pathname: string, method = 'DELETE'): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${pathname}`), { method });
}

async function runHandler(req: NextRequest, id: string) {
  const { DELETE } = await import('./route');
  return DELETE(req, { params: Promise.resolve({ id }) });
}

describe('DELETE /api/registrations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await runHandler(makeRequest('/api/registrations/1'), '1');
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken({ role: 'OPERATOR' }));
    const res = await runHandler(makeRequest('/api/registrations/1'), '1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when registration not found', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken());
    (removeRegistration as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Not found'));
    const res = await runHandler(makeRequest('/api/registrations/1'), '1');
    expect(res.status).toBe(404);
  });

  it('deletes registration successfully', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken());
    (removeRegistration as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'reg-1' });
    const res = await runHandler(makeRequest('/api/registrations/1'), '1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
