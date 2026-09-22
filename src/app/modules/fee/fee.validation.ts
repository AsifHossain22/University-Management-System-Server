import { z } from 'zod';

const feeStatusSchema = z.enum([
  'UNPAID',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
]);

export const createFeeSchema = z.object({
  studentId: z.uuid('Student ID must be a valid UUID'),

  title: z
    .string()
    .trim()
    .min(1, 'Fee title is required')
    .max(200, 'Fee title cannot exceed 200 characters'),

  description: z
    .string()
    .trim()
    .max(1000, 'Fee description cannot exceed 1000 characters')
    .optional(),

  amount: z.number().positive('Fee amount must be greater than 0'),

  dueDate: z.coerce.date({
    error: 'Due date must be a valid date',
  }),
});

export const updateFeeSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Fee title cannot be empty')
      .max(200, 'Fee title cannot exceed 200 characters')
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, 'Fee description cannot exceed 1000 characters')
      .optional(),

    amount: z.number().positive('Fee amount must be greater than 0').optional(),

    dueDate: z.coerce
      .date({
        error: 'Due date must be a valid date',
      })
      .optional(),

    status: feeStatusSchema.optional(),

    isActive: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one fee field is required to update the fee',
  });

export const feeQuerySchema = z.object({
  searchTerm: z.string().trim().optional(),

  studentId: z.uuid('Student ID must be a valid UUID').optional(),

  status: feeStatusSchema.optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),

  sortBy: z
    .enum(['title', 'amount', 'dueDate', 'createdAt'])
    .default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const feeIdParamSchema = z.object({
  feeId: z.uuid('Fee ID must be a valid UUID'),
});

export type CreateFeeInput = z.infer<typeof createFeeSchema>;
export type UpdateFeeInput = z.infer<typeof updateFeeSchema>;
export type FeeQueryInput = z.infer<typeof feeQuerySchema>;
