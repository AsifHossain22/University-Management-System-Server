import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.ts';
import { AuthService } from './auth.service.ts';

// RegisterUser
const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Registration initiated successfully!',
    data: result,
  });
});

// VerifyEmail
const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyEmail(req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Email verified and account created successfully!',
    data: result,
  });
});

// ForgotPassword
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.forgotPassword(req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Password reset OTP sent successfully!',
    data: result,
  });
});

// ResetPassword
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resetPassword(req.body);
  res.status(httpStatus.OK).json({
    success: true,
    message:
      'Password reset successfully! Please log in with your new password.',
    data: result,
  });
});

// LogInUser
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'User logged in successfully!',
    data: result,
  });
});

// RefreshToken
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.refreshToken(req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Access token refreshed successfully!',
    data: result,
  });
});

// GoogleLogin
const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.googleLogin(req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Google login successful!',
    data: result,
  });
});

// GetMe
const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getMe(req.user!.userId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'User profile retrieved successfully!',
    data: result,
  });
});

export const AuthController = {
  registerUser,
  verifyEmail,
  loginUser,
  refreshToken,
  googleLogin,
  getMe,
  forgotPassword,
  resetPassword,
};
