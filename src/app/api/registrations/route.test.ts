import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

vi.mock('@/services/registration-service', () => ({
  registerPerson: vi.fn(),
  getAllRegistrations: vi.fn(),
  getRegistrationsForOperator: vi.fn(),
  RegistrationAlreadyExistsError: class extends Error {
    constructor(public details: unknown) {
      super('Registration already exists.');
      this.name = 'RegistrationAlreadyExistsError';
    }
  },
}));

vi.mock('@/utils/csrf', () => ({
  verifyCsrf: vi.fn(() => true),
}));

import { getToken } from 'next-auth/jwt';
import { registerPerson, getAllRegistrations, getRegistrationsForOperator } from '@/services/registration-service';

describe('registrations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST returns 401 when unauthorized', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Test', lastName: 'User', nationalId: '1111111111' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('POST creates registration successfully', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'ADMIN' });
    (registerPerson as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'reg-1' });
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Test', lastName: 'User', nationalId: '1111111111' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ id: 'reg-1' });
  });

  it('POST returns 409 on duplicate registration', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'ADMIN' });
    const duplicateDetails = { registration: { operator: { fullname: 'Jane Doe' } } };
    (registerPerson as ReturnType<typeof vi.fn>).mockRejectedValue(
      new (await import('@/services/registration-service')).RegistrationAlreadyExistsError(duplicateDetails),
    );
    const { POST } = await import('./route');
    const req = new Request('http://localhost:3000/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Test', lastName: 'User', nationalId: '1111111111' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toBe('Registration already exists.');
  });

  it('GET returns registrations for admin', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'ADMIN' });
    (getAllRegistrations as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'reg-1' }]);
    const { GET } = await import('./route');
    const req = new Request('http://localhost:3000/api/registrations');
    const response = await GET(req);
    const data = await response.json();
    expect(data).toEqual([{ id: 'reg-1' }]);
  });

  it('GET returns registrations scoped for operator', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-2', role: 'OPERATOR' });
    (getRegistrationsForOperator as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'reg-2' }]);
    const { GET } = await import('./route');
    const req = new Request('http://localhost:3000/api/registrations');
    const response = await GET(req);
    const data = await response.json();
    expect(data).toEqual([{ id: 'reg-2' }]);
    expect(getRegistrationsForOperator).toHaveBeenCalledWith('user-2');
  });

  it('GET returns 401 when unauthorized', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { GET } = await import('./route');
    const req = new Request('http://localhost:3000/api/registrations');
    const response = await GET(req);
    expect(response.status).toBe(401);
  });
});
