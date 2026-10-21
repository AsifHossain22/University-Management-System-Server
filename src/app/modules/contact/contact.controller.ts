import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.ts';
import { contactMessageSchema } from './contact.validation.ts';
import { ContactService } from './contact.service.ts';

const sendContactMessage = catchAsync(async (req: Request, res: Response) => {
  const payload = contactMessageSchema.parse(req.body);

  await ContactService.sendContactMessage(payload);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Your message was accepted for email delivery.',
    data: null,
  });
});

export const ContactController = {
  sendContactMessage,
};
