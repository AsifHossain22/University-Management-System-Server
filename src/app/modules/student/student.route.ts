import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { upload } from '../../../lib/multer.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { StudentController } from './student.controller.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';
import { studentQuerySchema } from './student.validation.ts';

const router = Router();

// AdminCanViewAllStudents
router.get(
  '/',
  auth(UserRole.ADMIN),
  validateRequest(studentQuerySchema, 'query'),
  StudentController.getAllStudents,
);

// GetAuthenticatedStudentsProfile
router.get('/profile', auth(UserRole.STUDENT), StudentController.getMyProfile);

// UpdateAuthenticatedStudentsProfile
router.patch(
  '/profile',
  auth(UserRole.STUDENT),
  StudentController.updateMyProfile,
);

// UpdateAuthenticatedStudentsProfilePhoto
router.patch(
  '/profile/photo',
  auth(UserRole.STUDENT),
  upload.single('profilePhoto'),
  StudentController.updateProfilePhoto,
);

export const StudentRoutes = router;
