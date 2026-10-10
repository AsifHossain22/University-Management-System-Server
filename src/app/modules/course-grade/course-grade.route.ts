import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/client.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';
import { CourseGradeController } from './course-grade.controller.ts';
import { publishSectionGradesSchema } from './course-grade.validation.ts';

const router = Router();

// GetMyTranscript
router.get(
  '/my-transcript',
  auth(UserRole.STUDENT),
  CourseGradeController.getMyTranscript,
);

// PublishSectionGrades
router.post(
  '/sections/:sectionId/publish',
  auth(UserRole.ADMIN),
  validateRequest(publishSectionGradesSchema, 'params'),
  CourseGradeController.publishSectionGrades,
);

export const CourseGradeRoutes = router;
