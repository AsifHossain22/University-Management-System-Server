import { Router } from 'express';
import { contactRateLimiter } from '../../middlewares/rateLimit.ts';
import { ContactController } from './contact.controller.ts';

const router = Router();

router.post('/', contactRateLimiter, ContactController.sendContactMessage);

export const ContactRoutes = router;
