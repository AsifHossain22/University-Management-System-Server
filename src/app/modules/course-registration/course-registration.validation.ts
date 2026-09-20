import { z } from 'zod';

export const createCourseRegistrationSchema = z.object({
  sectionId: z.uuid('Section ID must be a valid UUID'),
});

export const courseRegistrationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z
    .enum(['REGISTERED', 'DROPPED', 'COMPLETED', 'CANCELLED'])
    .optional(),

  searchTerm: z.string().trim().min(1).optional(),
});

export type CreateCourseRegistrationInput = z.infer<
  typeof createCourseRegistrationSchema
>;

export type CourseRegistrationQueryInput = z.infer<
  typeof courseRegistrationQuerySchema
>;
