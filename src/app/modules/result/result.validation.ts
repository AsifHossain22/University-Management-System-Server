import { z } from 'zod';

const resultBaseSchema = z.object({
  registrationId: z.uuid('Registration ID must be a valid UUID'),
  examId: z.uuid('Exam ID must be a valid UUID'),
  obtainedMarks: z.number().min(0, 'Obtained marks cannot be negative'),
  remarks: z
    .string()
    .trim()
    .max(500, 'Remarks cannot exceed 500 characters')
    .optional(),
});

export const resultIdParamSchema = z.object({
  resultId: z.uuid('Result ID must be a valid UUID'),
});

export const createResultSchema = resultBaseSchema;

export const updateResultSchema = z
  .object({
    obtainedMarks: z
      .number()
      .min(0, 'Obtained marks cannot be negative')
      .optional(),
    remarks: z
      .string()
      .trim()
      .max(500, 'Remarks cannot exceed 500 characters')
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one result field is required to update the result',
  });

export const resultQuerySchema = z.object({
  searchTerm: z.string().trim().optional(),

  registrationId: z.uuid('Registration ID must be a valid UUID').optional(),

  examId: z.uuid('Exam ID must be a valid UUID').optional(),

  studentId: z.uuid('Student ID must be a valid UUID').optional(),

  sectionId: z.uuid('Section ID must be a valid UUID').optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),

  sortBy: z
    .enum(['obtainedMarks', 'createdAt', 'updatedAt'])
    .default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateResultInput = z.infer<typeof createResultSchema>;

export type UpdateResultInput = z.infer<typeof updateResultSchema>;

export type ResultQueryInput = z.infer<typeof resultQuerySchema>;
