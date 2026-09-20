import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { CourseRegistrationController } from './course-registration.controller.ts';

const router = Router();

// GetMyCourseRegistrations
router.get(
  '/',
  auth(UserRole.STUDENT),
  CourseRegistrationController.getMyRegistrations,
);

// RegisterCourse
router.post(
  '/',
  auth(UserRole.STUDENT),
  CourseRegistrationController.registerCourse,
);

// DropCourseRegistration
router.patch(
  '/:registrationId/drop',
  auth(UserRole.STUDENT),
  CourseRegistrationController.dropCourse,
);

export const CourseRegistrationRoutes = router;
