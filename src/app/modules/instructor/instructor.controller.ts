import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError.ts';
import { InstructorService } from './instructor.service.ts';
import { updateInstructorProfileSchema } from './instructor.validation.ts';

// GetMyProfile
const getMyProfile = async (req: Request, res: Response) => {
  if (!req.user?.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Authenticated instructor information was not found!',
    );
  }

  const result = await InstructorService.getMyProfile(req.user.userId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Instructor profile retrieved successfully!',
    data: result,
  });
};

// UpdateMyProfile
const updateMyProfile = async (req: Request, res: Response) => {
  if (!req.user?.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Authenticated instructor information was not found!',
    );
  }

  const payload = updateInstructorProfileSchema.parse(req.body);

  const result = await InstructorService.updateMyProfile(
    req.user.userId,
    payload,
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Instructor profile updated successfully!',
    data: result,
  });
};

// UpdateProfilePhoto
const updateProfilePhoto = async (req: Request, res: Response) => {
  if (!req.user?.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Authenticated instructor information was not found!',
    );
  }

  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Profile photo is required!');
  }

  const result = await InstructorService.updateProfilePhoto(
    req.user.userId,
    req.file,
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Instructor profile photo updated successfully!',
    data: result,
  });
};

export const InstructorController = {
  getMyProfile,
  updateMyProfile,
  updateProfilePhoto,
};
