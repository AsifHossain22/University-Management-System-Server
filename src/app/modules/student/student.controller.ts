import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError.ts';
import { StudentService } from './student.service.ts';
import { updateStudentProfileSchema } from './student.validation.ts';

// GetMyProfile
const getMyProfile = async (req: Request, res: Response) => {
  if (!req.user?.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Authenticated student information was not found!',
    );
  }

  const result = await StudentService.getMyProfile(req.user.userId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Student profile retrieved successfully!',
    data: result,
  });
};

// UpdateMyProfile
const updateMyProfile = async (req: Request, res: Response) => {
  if (!req.user?.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Authenticated student information was not found!',
    );
  }

  const payload = updateStudentProfileSchema.parse(req.body);

  const result = await StudentService.updateMyProfile(req.user.userId, payload);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Student profile updated successfully!',
    data: result,
  });
};

// UpdateProfilePhoto
const updateProfilePhoto = async (req: Request, res: Response) => {
  if (!req.user?.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Authenticated student information was not found!',
    );
  }

  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Profile photo is required!');
  }

  const result = await StudentService.updateProfilePhoto(
    req.user.userId,
    req.file,
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Student profile photo updated successfully!',
    data: result,
  });
};

export const StudentController = {
  getMyProfile,
  updateMyProfile,
  updateProfilePhoto,
};
