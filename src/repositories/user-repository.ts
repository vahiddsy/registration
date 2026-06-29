import { prisma } from '@/lib/prisma';
import type { UserRole } from '@/types/auth';

export function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export function createUser(data: { fullname: string; username: string; passwordHash: string; role: UserRole; active: boolean; forcePasswordChange: boolean }) {
  return prisma.user.create({ data });
}

export function updateUser(id: string, data: Partial<{ fullname: string; username: string; passwordHash: string; role: UserRole; active: boolean; forcePasswordChange: boolean }>) {
  return prisma.user.update({ where: { id }, data });
}

export function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
