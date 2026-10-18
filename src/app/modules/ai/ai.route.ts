import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/client.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { aiRateLimiter } from '../../middlewares/rateLimit.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';
import { AIController } from './ai.controller.ts';
import {
  academicAssistantSchema,
  courseRecommendationSchema,
} from './ai.validation.ts';

const router = Router();

// AcademicAssitant
router.post(
  '/academic-assistant',
  auth(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN),
  aiRateLimiter,
  validateRequest(academicAssistantSchema),
  AIController.academicAssistant,
);

// CourseRecommendations
router.post(
  '/course-recommendations',
  auth(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN),
  aiRateLimiter,
  validateRequest(courseRecommendationSchema),
  AIController.courseRecommendations,
);

export const AIRoutes = router;
