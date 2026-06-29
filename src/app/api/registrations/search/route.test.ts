import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

vi.mock('@/services/registration-service', () => ({
  searchRegistrationData: vi.fn(),
}));

import { getToken } from 'next-auth/jwt';
import { searchRegistrationData } from '@/services/registration-service';

describe('registrations search API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { GET } = await import('./route');
    const req = new Request('http://localhost:3000/api/registrations/search?q=test');
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it('calls searchRegistrationData with role and operatorId', async () => {
    (getToken as ReturnType<typeof vi.fn>).mockResolvedValue({ sub: 'user-1', role: 'OPERATOR' });
    (searchRegistrationData as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'reg-1' }]);
    const { GET } = await import('./route');
    const req = new Request('http://localhost:3000/api/registrations/search?q=ali');
    const response = await GET(req);
    const data = await response.json();
    expect(data).toEqual([{ id: 'reg-1' }]);
    expect(searchRegistrationData).toHaveBeenCalledWith('ali', { role: 'OPERATOR', operatorId: 'user-1' });
  });
});
