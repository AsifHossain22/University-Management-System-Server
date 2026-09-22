import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';
import { AuditLogController } from './audit-log.controller.ts';
import { auditLogQuerySchema } from './audit-log.validation.ts';

const router = Router();

router.get(
  '/',
  auth(UserRole.ADMIN),
  validateRequest(auditLogQuerySchema, 'query'),
  AuditLogController.getAllAuditLogs,
);

router.get('/:id', auth(UserRole.ADMIN), AuditLogController.getAuditLogById);

export const AuditLogRoutes = router;
