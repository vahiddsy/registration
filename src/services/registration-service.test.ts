import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllRegistrations, getRegistrationsForOperator, registerPerson, removeRegistration, searchRegistrationData } from './registration-service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    registration: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('registration service', () => {
  const findUnique = prisma.registration.findUnique as unknown as ReturnType<typeof vi.fn>;
  const create = prisma.registration.create as unknown as ReturnType<typeof vi.fn>;
  const findMany = prisma.registration.findMany as unknown as ReturnType<typeof vi.fn>;
  const delete_ = prisma.registration.delete as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    (findUnique as any).mockReset();
    (create as any).mockReset();
    (findMany as any).mockReset();
    (delete_ as any).mockReset();
  });

  it('rejects invalid registration data', async () => {
    await expect(registerPerson({ firstName: 'A', lastName: 'B', nationalId: '123', operatorId: 'op' })).rejects.toThrow('National ID must be 10 digits');
  });

  it('rejects duplicate registrations with operator details', async () => {
    const existingRegistration = { id: '1', operator: { fullname: 'Jane Doe' }, createdAt: new Date('2024-01-01') };
    (findUnique as any).mockResolvedValue(existingRegistration);

    await expect(registerPerson({ firstName: 'Test', lastName: 'User', nationalId: '1111111111', operatorId: 'op' })).rejects.toMatchObject({
      name: 'RegistrationAlreadyExistsError',
      details: { registration: existingRegistration },
    });
  });

  it('creates registration when not duplicated', async () => {
    (findUnique as any).mockResolvedValue(null);
    (create as any).mockResolvedValue({ id: '2' });
    const result = await registerPerson({ firstName: 'Test', lastName: 'User', nationalId: '1111111111', operatorId: 'op' });
    expect(result).toEqual({ id: '2' });
  });

  it('returns all registrations for admins', async () => {
    (findMany as any).mockResolvedValue([{ id: 'registration-1' }]);

    await expect(getAllRegistrations()).resolves.toEqual([{ id: 'registration-1' }]);
    expect(findMany).toHaveBeenCalledWith({ include: { operator: true }, orderBy: { createdAt: 'desc' } });
  });

  it('returns registrations for one operator', async () => {
    (findMany as any).mockResolvedValue([{ id: 'registration-2', operatorId: 'op-1' }]);

    await expect(getRegistrationsForOperator('op-1')).resolves.toEqual([{ id: 'registration-2', operatorId: 'op-1' }]);
    expect(findMany).toHaveBeenCalledWith({ where: { operatorId: 'op-1' }, orderBy: { createdAt: 'desc' } });
  });

  it('scopes searches for operators', async () => {
    (findMany as any).mockResolvedValue([{ id: 'registration-3', operatorId: 'op-2' }]);

    await expect(searchRegistrationData('ali', { role: 'OPERATOR', operatorId: 'op-2' })).resolves.toEqual([{ id: 'registration-3', operatorId: 'op-2' }]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        operatorId: 'op-2',
        OR: [
          { nationalId: { contains: 'ali' } },
          { firstName: { contains: 'ali' } },
          { lastName: { contains: 'ali' } },
        ],
      },
      include: { operator: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('removes a registration by id', async () => {
    (delete_ as any).mockResolvedValue({ id: 'reg-1' });
    const result = await removeRegistration('reg-1');
    expect(result).toEqual({ id: 'reg-1' });
    expect(delete_).toHaveBeenCalledWith({ where: { id: 'reg-1' } });
  });

  it('does not scope searches for admins', async () => {
    (findMany as any).mockResolvedValue([{ id: 'registration-4' }]);

    await expect(searchRegistrationData('reza', { role: 'ADMIN', operatorId: 'op-3' })).resolves.toEqual([{ id: 'registration-4' }]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { nationalId: { contains: 'reza' } },
          { firstName: { contains: 'reza' } },
          { lastName: { contains: 'reza' } },
        ],
      },
      include: { operator: true },
      orderBy: { createdAt: 'desc' },
    });
  });
});
