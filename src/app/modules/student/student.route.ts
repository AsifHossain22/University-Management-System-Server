import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { upload } from '../../../lib/multer.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { StudentController } from './student.controller.ts';

const router = Router();

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
