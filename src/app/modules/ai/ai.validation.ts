import { z } from 'zod';

export const academicAssistantSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please enter a message.')
    .max(2000, 'Your message must not exceed 2000 characters.'),
});

export const courseRecommendationSchema = z.object({
  interests: z
    .string()
    .trim()
    .min(3, 'Please describe your academic interests.')
    .max(1000, 'Interests must not exceed 1000 characters.'),

  goals: z
    .string()
    .trim()
    .min(3, 'Please describe your academic goals.')
    .max(1000, 'Goals must not exceed 1000 characters.'),

  programId: z.string().trim().min(1).optional(),

  preferredCredits: z.number().int().positive().max(30).optional(),
});
