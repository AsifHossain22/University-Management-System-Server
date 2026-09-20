import { z } from 'zod';

const attendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);

export const createAttendanceSchema = z.object({
  registrationId: z.uuid('Registration ID must be a valid UUID'),

  date: z.coerce.date({
    error: 'Attendance date must be a valid date',
  }),

  status: attendanceStatusSchema,

  remarks: z
    .string()
    .trim()
    .max(500, 'Remarks cannot exceed 500 characters')
    .optional(),
});

export const updateAttendanceSchema = z
  .object({
    status: attendanceStatusSchema.optional(),

    remarks: z
      .string()
      .trim()
      .max(500, 'Remarks cannot exceed 500 characters')
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one attendance field must be provided',
  });

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: attendanceStatusSchema.optional(),

  date: z.coerce.date().optional(),

  searchTerm: z.string().trim().min(1).optional(),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;

export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;

export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
