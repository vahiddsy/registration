import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

vi.mock('@/services/user-service', () => ({
  getUsers: vi.fn(),
  createManagedUser: vi.fn(),
  UserAlreadyExistsError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'UserAlreadyExistsError';
    }
  },
}));

import { getToken } from 'next-auth/jwt';
import { getUsers, createManagedUser } from '@/services/user-service';

describe('users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 403 for non-admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'OPERATOR' });
    const { GET } = await import('./route');
    const req = new Request('http://localhost:3000/api/users');
    const response = await GET(req);
    expect(response.status).toBe(403);
  });

  it('GET returns users for admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'ADMIN' });
    (getUsers as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'u1', username: 'op1' }]);
    const { GET } = await import('./route');
    const req = new Request('http://localhost:3000/api/users');
    const response = await GET(req);
    const data = await response.json();
    expect(data).toEqual([{ id: 'u1', username: 'op1' }]);
  });

  it('POST returns 403 for non-admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'OPERATOR' });
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: 'Test', username: 'test', password: 'password123' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
  });

  it('POST creates user for admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'ADMIN' });
    (createManagedUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-user', username: 'op2' });
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: 'Operator 2', username: 'op2', password: 'password123' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toEqual({ id: 'new-user', username: 'op2' });
  });

  it('POST returns 409 on duplicate username', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'ADMIN' });
    (createManagedUser as ReturnType<typeof vi.fn>).mockRejectedValue(
      new (await import('@/services/user-service')).UserAlreadyExistsError('op2'),
    );
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: 'Operator 2', username: 'op2', password: 'password123' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(409);
  });
});
