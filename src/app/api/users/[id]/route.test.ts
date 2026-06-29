import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

vi.mock('@/services/user-service', () => ({
  updateManagedUser: vi.fn(),
  deleteManagedUser: vi.fn(),
  UserNotFoundError: class extends Error {
    constructor() {
      super('User not found.');
      this.name = 'UserNotFoundError';
    }
  },
  UserAlreadyExistsError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'UserAlreadyExistsError';
    }
  },
  CannotDeleteSelfError: class extends Error {
    constructor() {
      super('You cannot delete your own user account.');
      this.name = 'CannotDeleteSelfError';
    }
  },
}));

import { getToken } from 'next-auth/jwt';
import { updateManagedUser, deleteManagedUser } from '@/services/user-service';

describe('users/[id] API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('PATCH returns 403 for non-admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'OPERATOR' });
    const { PATCH } = await import('./route');
    const req = new Request('http://localhost:3000/api/users/user-2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: 'Updated' }),
    });
    const response = await PATCH(req, { params: Promise.resolve({ id: 'user-2' }) });
    expect(response.status).toBe(403);
  });

  it('PATCH updates user for admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'ADMIN' });
    (updateManagedUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-2', fullname: 'Updated' });
    const { PATCH } = await import('./route');
    const req = new Request('http://localhost:3000/api/users/user-2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: 'Updated' }),
    });
    const response = await PATCH(req, { params: Promise.resolve({ id: 'user-2' }) });
    const data = await response.json();
    expect(data).toEqual({ id: 'user-2', fullname: 'Updated' });
  });

  it('DELETE returns 403 for non-admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'OPERATOR' });
    const { DELETE } = await import('./route');
    const req = new Request('http://localhost:3000/api/users/user-2', { method: 'DELETE' });
    const response = await DELETE(req, { params: Promise.resolve({ id: 'user-2' }) });
    expect(response.status).toBe(403);
  });

  it('DELETE removes user for admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'admin-1', role: 'ADMIN' });
    (deleteManagedUser as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    const { DELETE } = await import('./route');
    const req = new Request('http://localhost:3000/api/users/user-2', { method: 'DELETE' });
    const response = await DELETE(req, { params: Promise.resolve({ id: 'user-2' }) });
    const data = await response.json();
    expect(data).toEqual({ success: true });
  });
});
