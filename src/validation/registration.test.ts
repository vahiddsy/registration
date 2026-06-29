import { describe, it, expect } from 'vitest';
import { registrationFormSchema, isValidIranianNationalId } from './registration';

describe('registration validation', () => {
  it('accepts valid national id', () => {
    expect(isValidIranianNationalId('1111111111')).toBe(true);
  });

  it('rejects invalid national id', () => {
    expect(isValidIranianNationalId('1111111112')).toBe(false);
  });

  it('rejects invalid form data', () => {
    const result = registrationFormSchema.safeParse({ firstName: '', lastName: '', nationalId: '123' });
    expect(result.success).toBe(false);
  });
});
