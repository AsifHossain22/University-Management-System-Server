import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { InstructorApplicationController } from './instructor-application.controller.ts';

const router = Router();

// ApplyAsInstructor
router.post('/apply', InstructorApplicationController.applyAsInstructor);

// VerifyInstructorEmail
router.post(
  '/verify-email',
  InstructorApplicationController.verifyInstructorEmail,
);

// GetAllInstructorApplications
router.get(
  '/',
  auth(UserRole.ADMIN),
  InstructorApplicationController.getAllInstructorApplications,
);

// ReviewInstructorApplication
router.patch(
  '/:id/review',
  auth(UserRole.ADMIN),
  InstructorApplicationController.reviewInstructorApplication,
);

export const InstructorApplicationRoutes = router;
