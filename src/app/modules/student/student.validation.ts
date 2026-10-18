import { z } from 'zod';

export const updateStudentProfileSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name cannot be empty')
      .optional(),

    lastName: z.string().trim().min(1, 'Last name cannot be empty').optional(),

    phone: z
      .string()
      .trim()
      .min(7, 'Phone number must be at least 7 characters')
      .max(20, 'Phone number cannot exceed 20 characters')
      .optional(),

    address: z.string().trim().min(1, 'Address cannot be empty').optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one profile field must be provided',
  });

export type UpdateStudentProfileInput = z.infer<
  typeof updateStudentProfileSchema
>;

export const studentQuerySchema = z.object({
  searchTerm: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type StudentQueryInput = z.infer<typeof studentQuerySchema>;
