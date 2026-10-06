import { Router } from 'express';
import { AuthController } from './auth.controller.ts';
import { AuthValidation } from './auth.validation.ts';
import { auth } from '../../middlewares/checkAuth.ts';
import { authRateLimiter } from '../../middlewares/rateLimit.ts';
import { validateRequest } from '../../middlewares/validateRequest.ts';
import { upload } from '../../../lib/multer.ts';

const router = Router();

// RegisterUser
router.post(
  '/register',
  authRateLimiter,
  validateRequest(AuthValidation.registerUserSchema),
  AuthController.registerUser,
);

// VerifyEmail
router.post(
  '/verify-email',
  authRateLimiter,
  validateRequest(AuthValidation.verifyEmailSchema),
  AuthController.verifyEmail,
);

// ForgotPassword
router.post(
  '/forgot-password',
  authRateLimiter,
  validateRequest(AuthValidation.forgotPasswordSchema),
  AuthController.forgotPassword,
);

// ResetPassword
router.post(
  '/reset-password',
  authRateLimiter,
  validateRequest(AuthValidation.resetPasswordSchema),
  AuthController.resetPassword,
);

// LogInUser
router.post(
  '/login',
  authRateLimiter,
  validateRequest(AuthValidation.loginUserSchema),
  AuthController.loginUser,
);

// RefreshToken
router.post(
  '/refresh-token',
  authRateLimiter,
  validateRequest(AuthValidation.refreshTokenSchema),
  AuthController.refreshToken,
);

// GoogleLogin
router.post(
  '/google',
  authRateLimiter,
  validateRequest(AuthValidation.googleLoginSchema),
  AuthController.googleLogin,
);

// GetMe
router.get('/me', auth(), AuthController.getMe);

// UpdateMe
router.patch(
  '/me',
  auth(),
  validateRequest(AuthValidation.updateMeSchema),
  AuthController.updateMe,
);

router.patch(
  '/me/photo',
  auth(),
  upload.single('profilePhoto'),
  AuthController.updateProfilePhoto,
);

export const AuthRoutes = router;
