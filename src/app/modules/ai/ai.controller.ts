import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.ts';
import { AIService } from './ai.service.ts';

const academicAssistant = catchAsync(async (req, res) => {
  const result = await AIService.academicAssistant(req.body.message);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Academic assistant response generated successfully.',
    data: result,
  });
});

export const AIController = {
  academicAssistant,
};
