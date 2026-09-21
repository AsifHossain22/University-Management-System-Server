import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { AttendanceService } from './attendance.service.ts';
import type {
  AttendanceQueryInput,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from './attendance.validation.ts';
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

// GetAttendances
const getAttendances = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authenticated!');
  }

  const query = res.locals.query as AttendanceQueryInput;

  const result = await AttendanceService.getAttendances(req.user.userId, query);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Attendance records retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

// UpdateAttendance
const updateAttendance = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authenticated!');
  }

  const attendanceId = req.params.attendanceId;

  if (typeof attendanceId !== 'string') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid attendance ID!');
  }

  const payload = req.body as UpdateAttendanceInput;

  const result = await AttendanceService.updateAttendance(
    req.user.userId,
    attendanceId,
    payload,
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Attendance updated successfully!',
    data: result,
  });
});

export const AttendanceController = {
  createAttendance,
  getAttendances,
  updateAttendance,
};
