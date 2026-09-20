import { z } from 'zod';

const sectionBaseSchema = z.object({
  name: z.string().trim().min(1, 'Section name is required'),
  code: z.string().trim().min(1, 'Section code is required'),
  courseId: z.uuid('Course ID must be a valid UUID'),
  semesterId: z.uuid('Semester ID must be a valid UUID'),
  instructorId: z.uuid('Instructor ID must be a valid UUID'),
  capacity: z.coerce
    .number()
    .int('Section capacity must be a whole number')
    .positive('Section capacity must be greater than 0'),
  isActive: z.boolean().optional(),
});

export const createSectionSchema = sectionBaseSchema.omit({ isActive: true });

export const updateSectionSchema = sectionBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one field is required to update the section!',
      });
    }
  });

export const sectionQuerySchema = z.object({
  searchTerm: z.string().trim().optional(),
  courseId: z.uuid('Course ID must be a valid UUID').optional(),
  semesterId: z.uuid('Semester ID must be a valid UUID').optional(),
  instructorId: z.uuid('Instructor ID must be a valid UUID').optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform(value => value === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z
    .enum(['name', 'code', 'capacity', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

export type SectionQueryInput = z.infer<typeof sectionQuerySchema>;
