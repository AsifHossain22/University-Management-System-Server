import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { InstructorController } from './instructor.controller.ts';
import { upload } from '../../../lib/multer.ts';

const router = Router();

// GetMyProfile
router.get(
  '/profile',
  auth(UserRole.INSTRUCTOR),
  InstructorController.getMyProfile,
);

// UpdateMyProfile
router.patch(
  '/profile',
  auth(UserRole.INSTRUCTOR),
  InstructorController.updateMyProfile,
);

// UpdateProfilePhoto
router.patch(
  '/profile/photo',
  auth(UserRole.INSTRUCTOR),
  upload.single('profilePhoto'),
  InstructorController.updateProfilePhoto,
);

export const InstructorRoutes = router;
