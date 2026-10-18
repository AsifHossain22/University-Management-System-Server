import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.ts';
import { AIService } from './ai.service.ts';

// AcademicAssitant
const academicAssistant = catchAsync(async (req, res) => {
  const result = await AIService.academicAssistant(req.body.message);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Academic assistant response generated successfully.',
    data: result,
  });
});

// CourseRecommendations
const courseRecommendations = catchAsync(async (req, res) => {
  const result = await AIService.courseRecommendations(req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: result.message,
    data: {
      recommendations: result.recommendations,
    },
  });
});

export const AIController = {
  academicAssistant,
  courseRecommendations,
};
