import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),

  email: z
    .email('Please provide a valid email address')
    .max(254, 'Email cannot exceed 254 characters'),

  subject: z
    .string()
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(150, 'Subject cannot exceed 150 characters')
    .regex(/^[^\r\n]+$/, 'Subject must be a single line'),

  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message cannot exceed 5000 characters'),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
