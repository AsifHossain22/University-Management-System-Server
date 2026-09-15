import { Router } from 'express';
import { AuthController } from './auth.controller.ts';
import { AuthValidation } from './auth.validation.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';

const router = Router();

// RegisterUser
router.post(
  '/register',
  validateRequest(AuthValidation.registerUserSchema),
  AuthController.registerUser,
);

// LogInUser
router.post(
  '/login',
  validateRequest(AuthValidation.loginUserSchema),
  AuthController.loginUser,
);

export const AuthRoutes = router;
