import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import { AuthService } from './auth.service.ts';

// RegisterUser
const registerUser = async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'User registered successfully!',
    data: result,
  });
};

// LogInUser
const loginUser = async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'User logged in successfully!',
    data: result,
  });
};

export const AuthController = {
  registerUser,
  loginUser,
};
