import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { SectionController } from './section.controller.ts';

const router = Router();

// OnlyADMINCanCreateSections
router.post('/', auth(UserRole.ADMIN), SectionController.createSection);

// ADMIN | STUDENT | INSTRUCTOR - CanViewSections
router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.INSTRUCTOR),
  SectionController.getSections,
);

// ADMIN | STUDENT | INSTRUCTOR - CanViewSectionByID
router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.INSTRUCTOR),
  SectionController.getSectionById,
);

// OnlyADMINCanUpdateSection
router.patch('/:id', auth(UserRole.ADMIN), SectionController.updateSection);

// OnlyADMINCanDeleteSection
router.delete('/:id', auth(UserRole.ADMIN), SectionController.deleteSection);

export const SectionRoutes = router;
