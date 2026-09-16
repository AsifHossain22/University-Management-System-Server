import { Router } from 'express';
import { AuthController } from './auth.controller.ts';
import { AuthValidation } from './auth.validation.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';

const router = Router();

// RegisterUser
router.post(
  '/register',
  validateRequest(AuthValidation.registerUserSchema),
  AuthController.registerUser,
);

// VerifyEmail
router.post(
  '/verify-email',
  validateRequest(AuthValidation.verifyEmailSchema),
  AuthController.verifyEmail,
);

// LogInUser
router.post(
  '/login',
  validateRequest(AuthValidation.loginUserSchema),
  AuthController.loginUser,
);

// RefreshToken
router.post(
  '/refresh-token',
  validateRequest(AuthValidation.refreshTokenSchema),
  AuthController.refreshToken,
);

// GoogleLogin
router.post(
  '/google',
  validateRequest(AuthValidation.googleLoginSchema),
  AuthController.googleLogin,
);

// GetMe
router.get('/me', auth(), AuthController.getMe);

export const AuthRoutes = router;
