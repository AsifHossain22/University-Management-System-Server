import { z } from 'zod';

const registerUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'STUDENT', 'INSTRUCTOR']),
});

export const AuthValidation = {
  registerUserSchema,
};
