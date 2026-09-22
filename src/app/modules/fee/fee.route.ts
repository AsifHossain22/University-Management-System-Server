import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';
import { FeeController } from './fee.controller.ts';
import {
  createFeeSchema,
  feeIdParamSchema,
  feeQuerySchema,
  updateFeeSchema,
} from './fee.validation.ts';

const router = Router();

// AdminCreatesFeeForStudent
router.post(
  '/',
  auth(UserRole.ADMIN),
  validateRequest(createFeeSchema),
  FeeController.createFee,
);

// AdminCanViewAllFees
router.get(
  '/',
  auth(UserRole.ADMIN),
  validateRequest(feeQuerySchema, 'query'),
  FeeController.getAllFees,
);

// StudentCanViewOnlyOwnFees
router.get(
  '/my-fees',
  auth(UserRole.STUDENT),
  validateRequest(feeQuerySchema, 'query'),
  FeeController.getMyFees,
);

// AdminOrStudentWhoOwnsFeeCanViewOneFee
router.get(
  '/:feeId',
  auth(UserRole.ADMIN, UserRole.STUDENT),
  validateRequest(feeIdParamSchema, 'params'),
  FeeController.getSingleFee,
);

// AdminCanUpdateFee
router.patch(
  '/:feeId',
  auth(UserRole.ADMIN),
  validateRequest(feeIdParamSchema, 'params'),
  validateRequest(updateFeeSchema),
  FeeController.updateFee,
);

// AdminCanSoftDeleteFee
router.delete(
  '/:feeId',
  auth(UserRole.ADMIN),
  validateRequest(feeIdParamSchema, 'params'),
  FeeController.deleteFee,
);

export const FeeRoutes = router;
