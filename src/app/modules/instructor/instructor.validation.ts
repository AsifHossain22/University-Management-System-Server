import { z } from 'zod';

export const updateInstructorProfileSchema = z
  .object({
    specialization: z
      .string()
      .trim()
      .min(1, 'Specialization cannot be empty')
      .optional(),

    qualification: z
      .string()
      .trim()
      .min(1, 'Qualification cannot be empty')
      .optional(),

    experienceYears: z.coerce
      .number()
      .int('Experience years must be a whole number')
      .min(0, 'Experience years cannot be negative')
      .optional(),

    bio: z.string().trim().min(1, 'Bio cannot be empty').optional(),

    phone: z
      .string()
      .trim()
      .min(7, 'Phone number must be at least 7 characters')
      .max(20, 'Phone number cannot exceed 20 characters')
      .optional(),

    address: z.string().trim().min(1, 'Address cannot be empty').optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one profile field must be provided!',
  });

export type UpdateInstructorProfileInput = z.infer<
  typeof updateInstructorProfileSchema
>;
