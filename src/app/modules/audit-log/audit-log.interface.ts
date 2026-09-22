import type { Prisma } from '../../../generated/prisma/client.ts';

export interface ICreateAuditLogPayload {
  userId?: string | undefined;
  action: string;
  entity: string;
  entityId?: string | undefined;
  description?: string | undefined;
  metadata?: Prisma.InputJsonValue | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export interface IAuditLogQuery {
  page: number;
  limit: number;
  action?: string | undefined;
  entity?: string | undefined;
  entityId?: string | undefined;
  userId?: string | undefined;
  searchTerm?: string | undefined;
}
