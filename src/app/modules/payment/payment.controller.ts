import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import type {
  CreatePaymentInput,
  PaymentCallbackInput,
} from './payment.validation.ts';
import { PaymentService } from './payment.service.ts';
import config from '../../config/index.ts';

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

  try {
    const result = await PaymentService.handlePaymentCallback(payload);

    const frontendUrl = config.frontend_url;

    if (!frontendUrl) {
      throw new Error('FRONTEND_URL is not configured.');
    }

    const resultUrl = new URL(
      '/student-dashboard/fees/payment-result',
      frontendUrl,
    );

    resultUrl.searchParams.set('status', result.status);

    if ('invoiceNumber' in result && result.invoiceNumber) {
      resultUrl.searchParams.set('invoiceNumber', result.invoiceNumber);
    }

    if ('invoiceUrl' in result && result.invoiceUrl) {
      resultUrl.searchParams.set('invoiceUrl', result.invoiceUrl);
    }

    if ('message' in result && result.message) {
      resultUrl.searchParams.set('message', result.message);
    }

    return res.redirect(303, resultUrl.toString());
  } catch (error) {
    console.error('bKash callback processing failed:', error);

    const frontendUrl = config.frontend_url;

    if (!frontendUrl) {
      throw error;
    }

    const resultUrl = new URL(
      '/student-dashboard/fees/payment-result',
      frontendUrl,
    );

    resultUrl.searchParams.set('status', 'ERROR');
    resultUrl.searchParams.set(
      'message',
      'We could not confirm the payment result. Please check your fee history.',
    );

    return res.redirect(303, resultUrl.toString());
  }
};

export const PaymentController = {
  createPayment,
  handlePaymentCallback,
};
