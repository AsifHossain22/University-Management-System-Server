import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.ts';
import { AuthService } from './auth.service.ts';

// RegisterUser
const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'User registered successfully!',
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
  loginUser,
  refreshToken,
  googleLogin,
  getMe,
};
