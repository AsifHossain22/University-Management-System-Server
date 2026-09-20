import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError.ts';
import { CourseRegistrationService } from './course-registration.service.ts';
import {
  createCourseRegistrationSchema,
  courseRegistrationQuerySchema,
} from './course-registration.validation.ts';

// RegisterCourse
const registerCourse = async (req: Request, res: Response) => {
  if (!req.user?.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Authenticated student information was not found!',
    );
  }

  const payload = createCourseRegistrationSchema.parse(req.body);

  const result = await CourseRegistrationService.registerCourse(
    req.user.userId,
    payload,
  );

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Course registered successfully!',
    data: result,
  });
};

// GetMyRegistrations
const getMyRegistrations = async (req: Request, res: Response) => {
  if (!req.user?.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Authenticated student information was not found!',
    );
  }

  const query = courseRegistrationQuerySchema.parse(req.query);

  const result = await CourseRegistrationService.getMyRegistrations(
    req.user.userId,
    query,
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Course registrations retrieved successfully!',
    data: result,
  });
};

// DropCourse
const dropCourse = async (req: Request, res: Response) => {
  if (!req.user?.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Authenticated student information was not found!',
    );
  }

  const registrationId = req.params.registrationId;

  if (typeof registrationId !== 'string') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid registration ID!');
  }

  const result = await CourseRegistrationService.dropCourse(
    req.user.userId,
    registrationId,
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Course dropped successfully!',
    data: result,
  });
};

export const CourseRegistrationController = {
  registerCourse,
  getMyRegistrations,
  dropCourse,
};
