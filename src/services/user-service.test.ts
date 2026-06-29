import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { CannotDeleteSelfError, createManagedUser, deleteManagedUser, getUsers, updateManagedUser, UserAlreadyExistsError, UserNotFoundError } from './user-service';

const userModel = prisma.user as unknown as {
  findMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    fullname: 'Operator One',
    username: 'operator',
    passwordHash: 'hash',
    role: 'OPERATOR',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastLogin: null,
    forcePasswordChange: true,
    ...overrides,
  };
}

describe('user service', () => {
  beforeEach(() => {
    userModel.findMany.mockReset();
    userModel.findUnique.mockReset();
    userModel.create.mockReset();
    userModel.update.mockReset();
    userModel.delete.mockReset();
  });

  it('lists users without password hashes', async () => {
    userModel.findMany.mockResolvedValue([makeUser()]);

    const users = await getUsers();

    expect(users).toEqual([
      {
        id: 'user-1',
        fullname: 'Operator One',
        username: 'operator',
        role: 'OPERATOR',
        active: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        lastLogin: null,
        forcePasswordChange: true,
      },
    ]);
    expect(JSON.stringify(users)).not.toContain('passwordHash');
  });

  it('creates users with hashed passwords', async () => {
    userModel.findUnique.mockResolvedValue(null);
    userModel.create.mockImplementation(async ({ data }) => makeUser({ ...data, id: 'created-user' }));

    const user = await createManagedUser({
      fullname: 'Operator Two',
      username: 'operator2',
      password: 'password123',
      role: 'OPERATOR',
      active: true,
    });

    expect(user.username).toBe('operator2');
    expect(userModel.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: 'operator2',
        role: 'OPERATOR',
        active: true,
        forcePasswordChange: true,
        passwordHash: expect.stringMatching(/^\$2/),
      }),
    });
    expect(JSON.stringify(user)).not.toContain('passwordHash');
  });

  it('rejects duplicate usernames on create', async () => {
    userModel.findUnique.mockResolvedValue(makeUser());

    await expect(createManagedUser({ fullname: 'Operator Two', username: 'operator', password: 'password123', role: 'OPERATOR' })).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });

  it('updates users and hashes new passwords', async () => {
    userModel.findUnique.mockResolvedValueOnce(makeUser());
    userModel.update.mockImplementation(async ({ data }) => makeUser({ ...data, id: 'user-1' }));

    const user = await updateManagedUser('user-1', { fullname: 'Updated Operator', password: 'newpass123' });

    expect(user.fullname).toBe('Updated Operator');
    expect(userModel.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        fullname: 'Updated Operator',
        passwordHash: expect.stringMatching(/^\$2/),
        forcePasswordChange: false,
      }),
    });
  });

  it('rejects updates for missing users and duplicate usernames', async () => {
    userModel.findUnique.mockResolvedValueOnce(null);
    await expect(updateManagedUser('missing', { fullname: 'Someone' })).rejects.toBeInstanceOf(UserNotFoundError);

    userModel.findUnique.mockResolvedValueOnce(makeUser({ id: 'user-1', username: 'operator' })).mockResolvedValueOnce(makeUser({ id: 'user-2', username: 'taken' }));
    await expect(updateManagedUser('user-1', { username: 'taken' })).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });

  it('deletes users but prevents deleting the current account', async () => {
    await expect(deleteManagedUser('admin-1', 'admin-1')).rejects.toBeInstanceOf(CannotDeleteSelfError);

    userModel.findUnique.mockResolvedValue(makeUser({ id: 'operator-1' }));
    userModel.delete.mockResolvedValue(makeUser({ id: 'operator-1' }));

    await expect(deleteManagedUser('operator-1', 'admin-1')).resolves.toEqual({ success: true });
    expect(userModel.delete).toHaveBeenCalledWith({ where: { id: 'operator-1' } });
  });
});
