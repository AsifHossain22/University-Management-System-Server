import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';
import { ResultController } from './result.controller.ts';
import {
  createResultSchema,
  resultIdParamSchema,
  resultQuerySchema,
  updateResultSchema,
} from './result.validation.ts';

const router = Router();

// CreateResult
router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.INSTRUCTOR),
  validateRequest(createResultSchema),
  ResultController.createResult,
);

// GetResults
router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT),
  validateRequest(resultQuerySchema, 'query'),
  ResultController.getResults,
);

// GetResultByID
router.get(
  '/:resultId',
  auth(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT),
  validateRequest(resultIdParamSchema, 'params'),
  ResultController.getResultById,
);

// UpdateResult
router.patch(
  '/:resultId',
  auth(UserRole.ADMIN, UserRole.INSTRUCTOR),
  validateRequest(resultIdParamSchema, 'params'),
  validateRequest(updateResultSchema),
  ResultController.updateResult,
);

// DeleteResult
router.delete(
  '/:resultId',
  auth(UserRole.ADMIN),
  validateRequest(resultIdParamSchema, 'params'),
  ResultController.deleteResult,
);

export const ResultRoutes = router;
