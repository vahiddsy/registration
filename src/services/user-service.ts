import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { createUser, deleteUser, findUserById, findUserByUsername, listUsers, updateUser } from '@/repositories/user-repository';
import { createUserSchema, updateUserSchema } from '@/validation/user';

export class UserAlreadyExistsError extends Error {
  constructor(username: string) {
    super(`User "${username}" already exists.`);
    this.name = 'UserAlreadyExistsError';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found.');
    this.name = 'UserNotFoundError';
  }
}

export class CannotDeleteSelfError extends Error {
  constructor() {
    super('You cannot delete your own user account.');
    this.name = 'CannotDeleteSelfError';
  }
}

export function toSafeUser(user: User) {
  return {
    id: user.id,
    fullname: user.fullname,
    username: user.username,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    forcePasswordChange: user.forcePasswordChange,
  };
}

export async function getUsers() {
  const users = await listUsers();
  return users.map(toSafeUser);
}

export async function createManagedUser(input: unknown) {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid user data');
  }

  const existing = await findUserByUsername(parsed.data.username);
  if (existing) throw new UserAlreadyExistsError(parsed.data.username);

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await createUser({
    fullname: parsed.data.fullname,
    username: parsed.data.username,
    passwordHash,
    role: parsed.data.role,
    active: parsed.data.active,
    forcePasswordChange: true,
  });

  return toSafeUser(user);
}

export async function updateManagedUser(id: string, input: unknown) {
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid user data');
  }

  const existing = await findUserById(id);
  if (!existing) throw new UserNotFoundError();

  if (parsed.data.username && parsed.data.username !== existing.username) {
    const duplicate = await findUserByUsername(parsed.data.username);
    if (duplicate) throw new UserAlreadyExistsError(parsed.data.username);
  }

  const { password, ...rest } = parsed.data;
  const data: Parameters<typeof updateUser>[1] = { ...rest };
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
    data.forcePasswordChange = false;
  }

  const user = await updateUser(id, data);
  return toSafeUser(user);
}

export async function deleteManagedUser(id: string, currentUserId: string) {
  if (id === currentUserId) throw new CannotDeleteSelfError();

  const existing = await findUserById(id);
  if (!existing) throw new UserNotFoundError();

  await deleteUser(id);
  return { success: true };
}
