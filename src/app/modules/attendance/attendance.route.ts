import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';
import { AttendanceController } from './attendance.controller.ts';
import {
  attendanceQuerySchema,
  createAttendanceSchema,
  updateAttendanceSchema,
} from './attendance.validation.ts';

const router = Router();

// CreateAttendance
router.post(
  '/',
  auth(UserRole.INSTRUCTOR),
  validateRequest(createAttendanceSchema),
  AttendanceController.createAttendance,
);

// GetAttendances
router.get(
  '/',
  auth(UserRole.INSTRUCTOR),
  validateRequest(attendanceQuerySchema, 'query'),
  AttendanceController.getAttendances,
);

router.patch(
  '/:attendanceId',
  auth(UserRole.INSTRUCTOR),
  validateRequest(updateAttendanceSchema),
  AttendanceController.updateAttendance,
);

export const AttendanceRoutes = router;
