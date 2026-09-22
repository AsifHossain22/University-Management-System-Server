import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import type { AuditLogQueryInput } from './audit-log.validation.ts';
import { AuditLogService } from './audit-log.service.ts';

const getAllAuditLogs = async (req: Request, res: Response) => {
  const query = res.locals.query as AuditLogQueryInput;

  const result = await AuditLogService.getAllAuditLogs(query);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Audit logs retrieved successfully!',
    data: result,
  });
};

const getAuditLogById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (typeof id !== 'string') {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Audit log ID is required!',
      errors: [],
    });

    return;
  }

  const result = await AuditLogService.getAuditLogById(id);

  if (!result) {
    res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Audit log not found!',
      errors: [],
    });

    return;
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Audit log retrieved successfully!',
    data: result,
  });
};

export const AuditLogController = {
  getAllAuditLogs,
  getAuditLogById,
};
