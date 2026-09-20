import { z } from 'zod';

export const applyAsInstructorSchema = z.object({
  email: z.email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  specialization: z.string().trim().min(1, 'Specialization is required'),
  qualification: z.string().trim().min(1, 'Qualification is required'),
  experienceYears: z.coerce
    .number()
    .int('Experience years must be a whole number')
    .min(0, 'Experience years cannot be negative'),
  bio: z.string().trim().optional(),
  departmentId: z.uuid('Department ID must be a valid UUID').optional(),
});

export const verifyInstructorEmailSchema = z.object({
  email: z.email('Please provide a valid email address'),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

export const reviewInstructorApplicationSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'REJECTED' && !data.rejectionReason) {
      ctx.addIssue({
        code: 'custom',
        path: ['rejectionReason'],
        message: 'Rejection reason is required when rejecting an application',
      });
    }
  });

export type ApplyAsInstructorInput = z.infer<typeof applyAsInstructorSchema>;

export type VerifyInstructorEmailInput = z.infer<
  typeof verifyInstructorEmailSchema
>;

export type ReviewInstructorApplicationInput = z.infer<
  typeof reviewInstructorApplicationSchema
>;

export const instructorApplicationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  searchTerm: z.string().trim().min(1).optional(),
});

export type InstructorApplicationQueryInput = z.infer<
  typeof instructorApplicationQuerySchema
>;
