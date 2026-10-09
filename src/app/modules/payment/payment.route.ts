import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';
import { PaymentController } from './payment.controller.ts';
import {
  createPaymentSchema,
  paymentCallbackSchema,
} from './payment.validation.ts';

const router = Router();

// CreatePaymentByStudent
router.post(
  '/',
  auth(UserRole.STUDENT),
  validateRequest(createPaymentSchema),
  PaymentController.createPayment,
);

// BKashPaymentCallback
router.get(
  '/callback',
  validateRequest(paymentCallbackSchema, 'query'),
  PaymentController.handlePaymentCallback,
);

// GetPaymentHistoryForAuthenticatedStudent
router.get(
  '/my-payments',
  auth(UserRole.STUDENT),
  PaymentController.getMyPayments,
);

export const PaymentRoutes = router;
