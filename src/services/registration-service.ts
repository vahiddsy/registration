import { createRegistration, deleteRegistration, findRegistrationByNationalId, listRegistrations, listRegistrationsForOperator, searchRegistrations } from '@/repositories/registration-repository';
import { registrationFormSchema } from '@/validation/registration';

type RegistrationWithOperator = Awaited<ReturnType<typeof findRegistrationByNationalId>>;

export class RegistrationAlreadyExistsError extends Error {
  constructor(public readonly details: { registration: RegistrationWithOperator }) {
    super('Registration already exists.');
    this.name = 'RegistrationAlreadyExistsError';
  }
}

export async function registerPerson(input: { firstName: string; lastName: string; nationalId: string; operatorId: string }) {
  const parsed = registrationFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid registration data');
  }

  const existing = await findRegistrationByNationalId(input.nationalId);
  if (existing) {
    throw new RegistrationAlreadyExistsError({ registration: existing });
  }

  return createRegistration(input);
}

export async function getRegistrationsForOperator(operatorId: string) {
  return listRegistrationsForOperator(operatorId);
}

export async function getAllRegistrations() {
  return listRegistrations();
}

export async function removeRegistration(id: string) {
  return deleteRegistration(id);
}

export async function searchRegistrationData(query: string, options?: { role?: string; operatorId?: string }) {
  return searchRegistrations(query, options?.role === 'OPERATOR' ? options.operatorId : undefined);
}
