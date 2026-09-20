import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError.ts';
import {
  applyAsInstructorSchema,
  instructorApplicationQuerySchema,
  reviewInstructorApplicationSchema,
  verifyInstructorEmailSchema,
} from './instructor-application.validation.ts';
import { InstructorApplicationService } from './instructor-application.service.ts';

// ApplyAsInstructor
const applyAsInstructor = async (req: Request, res: Response) => {
  const payload = applyAsInstructorSchema.parse(req.body);

  const result = await InstructorApplicationService.applyAsInstructor(payload);

  res.status(httpStatus.CREATED).json({
    success: true,
    message:
      'Instructor application submitted successfully! Please verify your email.',
    data: result,
  });
};

// VerifyInstructorEmail
const verifyInstructorEmail = async (req: Request, res: Response) => {
  const payload = verifyInstructorEmailSchema.parse(req.body);

  const result =
    await InstructorApplicationService.verifyInstructorEmail(payload);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Email verified successfully!',
    data: result,
  });
};

// GetAllInstructorApplications
const getAllInstructorApplications = async (req: Request, res: Response) => {
  const query = instructorApplicationQuerySchema.parse(req.query);

  const result =
    await InstructorApplicationService.getAllInstructorApplications(query);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Instructor applications retrieved successfully!',
    data: result,
  });
};

// ReviewInstructorApplication
const reviewInstructorApplication = async (req: Request, res: Response) => {
  const applicationId = req.params.id;

  if (!applicationId || Array.isArray(applicationId)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Invalid instructor application ID!',
    );
  }

  if (!req.user?.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Authenticated Admin information was not found!',
    );
  }

  const payload = reviewInstructorApplicationSchema.parse(req.body);

  const result = await InstructorApplicationService.reviewInstructorApplication(
    applicationId,
    payload,
    req.user.userId,
  );

  res.status(httpStatus.OK).json({
    success: true,
    message:
      payload.status === 'APPROVED'
        ? 'Instructor application approved successfully!'
        : 'Instructor application rejected successfully!',
    data: result,
  });
};

export const InstructorApplicationController = {
  applyAsInstructor,
  verifyInstructorEmail,
  getAllInstructorApplications,
  reviewInstructorApplication,
};
