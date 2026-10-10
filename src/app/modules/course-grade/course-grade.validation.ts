import { z } from 'zod';

export const publishSectionGradesSchema = z.object({
  sectionId: z.string().uuid('Invalid section ID'),
});

export type PublishSectionGradesInput = z.infer<
  typeof publishSectionGradesSchema
>;
