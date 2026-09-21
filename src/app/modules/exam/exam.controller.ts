import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { ExamService } from './exam.service.ts';
import type { ExamQueryInput } from './exam.validation.ts';

// CreateExam
const createExam = async (req: Request, res: Response) => {
  const result = await ExamService.createExam(req.body);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Exam created successfully',
    data: result,
  });
};

// GetExams
const getExams = async (req: Request, res: Response) => {
  const query = res.locals.query as ExamQueryInput;

  const result = await ExamService.getExams(query);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Exams retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
};

// GetExamById
const getExamById = async (req: Request<{ examId: string }>, res: Response) => {
  const result = await ExamService.getExamById(req.params.examId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Exam retrieved successfully',
    data: result,
  });
};

// UpdateExam
const updateExam = async (req: Request<{ examId: string }>, res: Response) => {
  const result = await ExamService.updateExam(req.params.examId, req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Exam updated successfully',
    data: result,
  });
};

// SoftDeleteExam
const softDeleteExam = async (
  req: Request<{ examId: string }>,
  res: Response,
) => {
  const result = await ExamService.softDeleteExam(req.params.examId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Exam deleted successfully',
    data: result,
  });
};

export const ExamController = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  softDeleteExam,
};
