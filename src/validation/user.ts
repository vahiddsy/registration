import { z } from 'zod';

export const userRoleSchema = z.enum(['ADMIN', 'OPERATOR']);

export const createUserSchema = z.object({
  fullname: z.string().trim().min(2, 'Full name is required'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_.-]+$/, 'Username contains invalid characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: userRoleSchema.default('OPERATOR'),
  active: z.boolean().default(true),
});

export const updateUserSchema = z
  .object({
    fullname: z.string().trim().min(2, 'Full name is required').optional(),
    username: z.string().trim().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_.-]+$/, 'Username contains invalid characters').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    role: userRoleSchema.optional(),
    active: z.boolean().optional(),
    forcePasswordChange: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'No update fields provided');

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
