import { z } from 'zod';

const examBaseSchema = z.object({
  sectionId: z.string().uuid('Invalid section ID'),
  title: z.string().trim().min(1, 'Exam title is required'),
  type: z.enum(['MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT', 'PRESENTATION']),
  examDate: z.coerce.date(),
  totalMarks: z.number().positive('Total marks must be greater than 0'),
  passingMarks: z.number().positive('Passing marks must be greater than 0'),
  weight: z
    .number()
    .positive('Weight must be greater than 0')
    .max(100, 'Weight cannot exceed 100'),
  isActive: z.boolean().optional(),
});

export const createExamSchema = examBaseSchema.refine(
  data => data.passingMarks <= data.totalMarks,
  {
    message: 'Passing marks cannot exceed total marks',
    path: ['passingMarks'],
  },
);

export const updateExamSchema = examBaseSchema.partial().refine(
  data => {
    if (data.passingMarks === undefined || data.totalMarks === undefined) {
      return true;
    }

    return data.passingMarks <= data.totalMarks;
  },
  {
    message: 'Passing marks cannot exceed total marks',
    path: ['passingMarks'],
  },
);

export const examQuerySchema = z.object({
  searchTerm: z.string().trim().optional(),
  sectionId: z.string().uuid('Invalid section ID').optional(),
  type: z
    .enum(['MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT', 'PRESENTATION'])
    .optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform(value => value === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z
    .enum(['title', 'examDate', 'totalMarks', 'weight', 'createdAt'])
    .default('examDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type ExamQueryInput = z.infer<typeof examQuerySchema>;
