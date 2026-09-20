import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { CourseRegistrationController } from './course-registration.controller.ts';

const router = Router();

// RegisterCourse
router.post(
  '/',
  auth(UserRole.STUDENT),
  CourseRegistrationController.registerCourse,
);

export const CourseRegistrationRoutes = router;
