import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/client.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';
import { ExamController } from './exam.controller.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import {
  createExamSchema,
  examQuerySchema,
  updateExamSchema,
} from './exam.validation.ts';

const router = Router();

// CreateExam
router.post(
  '/',
  auth(UserRole.ADMIN),
  validateRequest(createExamSchema),
  ExamController.createExam,
);

// GetAllExams
router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT),
  validateRequest(examQuerySchema),
  ExamController.getExams,
);

// GetExamById
router.get(
  '/:examId',
  auth(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT),
  ExamController.getExamById,
);

// UpdateExam
router.patch(
  '/:examId',
  auth(UserRole.ADMIN),
  validateRequest(updateExamSchema),
  ExamController.updateExam,
);

// DeleteExam
router.delete('/:examId', auth(UserRole.ADMIN), ExamController.softDeleteExam);

export const ExamRoutes = router;
