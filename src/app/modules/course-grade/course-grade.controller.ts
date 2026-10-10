import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { CourseGradeService } from './course-grade.service.ts';
import { AppError } from '../../utils/AppError.ts';

// PublishSectionGrades
const publishSectionGrades = async (
  req: Request<{ sectionId: string }>,
  res: Response,
) => {
  const result = await CourseGradeService.publishSectionGrades(
    req.params.sectionId,
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Course grades calculated and published successfully!',
    data: result,
  });
};

// GetMyTranscript
const getMyTranscript = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Authenticated student information was not found!',
    );
  }

  const result = await CourseGradeService.getMyTranscript(userId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Student transcript retrieved successfully!',
    data: result,
  });
};

export const CourseGradeController = {
  publishSectionGrades,
  getMyTranscript,
};
