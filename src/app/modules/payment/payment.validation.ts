import { z } from 'zod';

export const createPaymentSchema = z.object({
  feeId: z.uuid('Fee ID must be a valid UUID'),

  amount: z
    .number()
    .positive('Payment amount must be greater than 0')
    .refine(
      value => Number.isInteger(value * 100),
      'Payment amount cannot have more than 2 decimal places',
    ),
});

export const paymentCallbackSchema = z.object({
  paymentID: z.string().trim().min(1, 'Payment ID is required'),

  status: z.enum(['success', 'failure', 'cancel']),

  signature: z.string().trim().optional(),

  apiVersion: z.string().trim().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export type PaymentCallbackInput = z.infer<typeof paymentCallbackSchema>;
