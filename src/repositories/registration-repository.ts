import { prisma } from '@/lib/prisma';

export async function findRegistrationByNationalId(nationalId: string) {
  return prisma.registration.findUnique({
    where: { nationalId },
    include: { operator: true },
  });
}

export async function createRegistration(input: { firstName: string; lastName: string; nationalId: string; operatorId: string }) {
  return prisma.registration.create({ data: input });
}

export async function listRegistrationsForOperator(operatorId: string) {
  return prisma.registration.findMany({ where: { operatorId }, orderBy: { createdAt: 'desc' } });
}

export async function listRegistrations() {
  return prisma.registration.findMany({ include: { operator: true }, orderBy: { createdAt: 'desc' } });
}

export async function deleteRegistration(id: string) {
  return prisma.registration.delete({ where: { id } });
}

export async function searchRegistrations(query: string, operatorId?: string) {
  return prisma.registration.findMany({
    where: {
      ...(operatorId ? { operatorId } : {}),
      OR: [
        { nationalId: { contains: query } },
        { firstName: { contains: query } },
        { lastName: { contains: query } },
      ],
    },
    include: { operator: true },
    orderBy: { createdAt: 'desc' },
  });
}
