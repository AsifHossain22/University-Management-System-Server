import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';
import { AttendanceController } from './attendance.controller.ts';
import { createAttendanceSchema } from './attendance.validation.ts';

const router = Router();

// CreateAttendance
router.post(
  '/',
  auth(UserRole.INSTRUCTOR),
  validateRequest(createAttendanceSchema),
  AttendanceController.createAttendance,
);

export const AttendanceRoutes = router;
