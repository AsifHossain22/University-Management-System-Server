import { z } from 'zod';

// RegisterUserSchema
const registerUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  role: z.literal('STUDENT'),
});

// LoginUserSchema
const loginUserSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password is required'),
});

// RefreshTokenSchema
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// GoogleLoginSchema
const googleLoginSchema = z.object({
  idToken: z
    .string({ error: 'Google ID token is required' })
    .min(1, 'Google ID token is required'),
});

export const AuthValidation = {
  registerUserSchema,
  loginUserSchema,
  refreshTokenSchema,
  googleLoginSchema,
};
