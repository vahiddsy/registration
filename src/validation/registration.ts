import { z } from 'zod';

export const iranianNationalIdSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'National ID must be 10 digits');

export function isValidIranianNationalId(nationalId: string) {
  if (!iranianNationalIdSchema.safeParse(nationalId).success) return false;
  const digits = nationalId.split('').map(Number);
  const checkDigit = digits[9];
  const sum = digits.slice(0, 9).reduce((acc, digit, index) => acc + digit * (10 - index), 0);
  const remainder = sum % 11;
  const expected = remainder < 2 ? remainder : 11 - remainder;
  return expected === checkDigit;
}

export const registrationFormSchema = z.object({
  firstName: z.string().optional().default(''),
  lastName: z.string().optional().default(''),
  nationalId: z.string().trim().regex(/^\d{10}$/, 'National ID must be 10 digits'),
}).superRefine((data, ctx) => {
  if (!isValidIranianNationalId(data.nationalId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nationalId'], message: 'Invalid Iranian National ID checksum' });
  }
});
