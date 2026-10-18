import { z } from 'zod';

export const academicAssistantSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please enter a message.')
    .max(2000, 'Your message must not exceed 2000 characters.'),
});
