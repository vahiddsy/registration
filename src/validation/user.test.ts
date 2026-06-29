import { describe, expect, it } from 'vitest';
import { createUserSchema, updateUserSchema } from './user';

describe('user validation', () => {
  it('accepts a valid operator creation payload', () => {
    const result = createUserSchema.safeParse({
      fullname: 'Operator One',
      username: 'operator.one',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('OPERATOR');
      expect(result.data.active).toBe(true);
    }
  });

  it('rejects invalid usernames and roles', () => {
    const result = createUserSchema.safeParse({
      fullname: 'Operator One',
      username: 'bad username!',
      password: 'password123',
      role: 'MANAGER',
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty update payloads', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false);
  });
});
