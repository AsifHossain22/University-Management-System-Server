import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import type {
  CreatePaymentInput,
  PaymentCallbackInput,
} from './payment.validation.ts';
import { PaymentService } from './payment.service.ts';

const createPayment = async (req: Request, res: Response) => {
  const payload = req.body as CreatePaymentInput;

  const result = await PaymentService.createPayment(req.user!.userId, payload);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Payment created successfully!',
    data: result,
  });
};

const handlePaymentCallback = async (req: Request, res: Response) => {
  const payload = res.locals.query as PaymentCallbackInput;

  const result = await PaymentService.handlePaymentCallback(payload);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Payment callback processed successfully!',
    data: result,
  });
};

export const PaymentController = {
  createPayment,
  handlePaymentCallback,
};
