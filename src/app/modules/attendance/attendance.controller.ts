import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { AttendanceService } from './attendance.service.ts';
import type { CreateAttendanceInput } from './attendance.validation.ts';
import { catchAsync } from '../../utils/catchAsync.ts';
import { AppError } from '../../utils/AppError.ts';

// CreateAttendance
const createAttendance = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authenticated!');
  }

  const payload = req.body as CreateAttendanceInput;

  const result = await AttendanceService.createAttendance(
    req.user.userId,
    payload,
  );

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Attendance marked successfully!',
    data: result,
  });
});

export const AttendanceController = {
  createAttendance,
};
