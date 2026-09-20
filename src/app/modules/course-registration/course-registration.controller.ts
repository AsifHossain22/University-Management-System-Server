import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError.ts';
import { CourseRegistrationService } from './course-registration.service.ts';
import { createCourseRegistrationSchema } from './course-registration.validation.ts';

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

export const CourseRegistrationController = {
  registerCourse,
};
