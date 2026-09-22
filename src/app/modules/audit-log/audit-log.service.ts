import type { Prisma } from '../../../generated/prisma/client.ts';

import { prisma } from '../../../lib/prisma.ts';

import type {
  IAuditLogQuery,
  ICreateAuditLogPayload,
} from './audit-log.interface.ts';

type AuditLogDatabaseClient = typeof prisma | Prisma.TransactionClient;

const createAuditLog = async (
  payload: ICreateAuditLogPayload,
  db: AuditLogDatabaseClient = prisma,
) => {
  return db.auditLog.create({
    data: {
      action: payload.action,
      entity: payload.entity,

      ...(payload.userId !== undefined && {
        user: {
          connect: {
            id: payload.userId,
          },
        },
      }),

      ...(payload.entityId !== undefined && {
        entityId: payload.entityId,
      }),

      ...(payload.description !== undefined && {
        description: payload.description,
      }),

      ...(payload.metadata !== undefined && {
        metadata: payload.metadata,
      }),

      ...(payload.ipAddress !== undefined && {
        ipAddress: payload.ipAddress,
      }),

      ...(payload.userAgent !== undefined && {
        userAgent: payload.userAgent,
      }),
    },
  });
};

const getAllAuditLogs = async (query: IAuditLogQuery) => {
  const { page, limit, action, entity, entityId, userId, searchTerm } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {
    ...(action !== undefined && { action }),
    ...(entity !== undefined && { entity }),
    ...(entityId !== undefined && { entityId }),
    ...(userId !== undefined && { userId }),

    ...(searchTerm !== undefined && {
      OR: [
        {
          action: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          entity: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ],
    }),
  };

  const [auditLogs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        action: true,
        entity: true,
        entityId: true,
        description: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),

    prisma.auditLog.count({
      where,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: auditLogs,
  };
};

const getAuditLogById = async (id: string) => {
  return prisma.auditLog.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      userId: true,
      action: true,
      entity: true,
      entityId: true,
      description: true,
      metadata: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });
};

export const AuditLogService = {
  createAuditLog,
  getAllAuditLogs,
  getAuditLogById,
};
