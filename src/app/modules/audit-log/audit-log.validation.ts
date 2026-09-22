import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),

  action: z.string().trim().min(1).optional(),

  entity: z.string().trim().min(1).optional(),

  entityId: z.uuid('Entity ID must be a valid UUID').optional(),

  userId: z.uuid('User ID must be a valid UUID').optional(),

  searchTerm: z.string().trim().min(1).optional(),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
