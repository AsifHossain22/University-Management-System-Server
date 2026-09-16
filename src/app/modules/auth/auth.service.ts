import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { prisma } from '../../../lib/prisma.ts';
import { AppError } from '../../utils/AppError.ts';
import { jwtUtils } from '../../utils/jwt.ts';
import type {
  IGoogleLoginPayload,
  IRefreshTokenPayload,
  ILoginUser,
  IRegisterUser,
} from './auth.interface.ts';
import { googleUtils } from '../../utils/google.ts';

// RegisterUser
const registerUser = async (payload: IRegisterUser) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  // CheckIfUserAlreadyExists
  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      'User already exists with this email!',
    );
  }

  // HashPassword
  const passwordHash = await bcrypt.hash(payload.password, 12);

  // CreateUser
  const user = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
    },
    omit: {
      passwordHash: true,
    },
  });

  return user;
};

// LogInUser
const loginUser = async (payload: ILoginUser) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password!');
  }

  if (!user.isActive || user.deletedAt) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account is inactive. Please contact the Admin.',
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.passwordHash ?? '',
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password!');
  }

  // TokenPayload
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  // CreateAccessToken
  const accessToken = jwtUtils.createAccessToken(tokenPayload);

  // CreateRefreshToken
  const refreshToken = jwtUtils.createRefreshToken(tokenPayload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
    },
  };
};

// RefreshToken
const refreshToken = async (payload: IRefreshTokenPayload) => {
  const verifiedToken = jwtUtils.verifyRefreshToken(payload.refreshToken);

  if (!verifiedToken.success) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Invalid or expired refresh token.',
    );
  }

  const tokenPayload = verifiedToken.data;

  if (
    typeof tokenPayload !== 'object' ||
    tokenPayload === null ||
    !('userId' in tokenPayload) ||
    !('email' in tokenPayload) ||
    !('role' in tokenPayload)
  ) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Invalid refresh token payload.',
    );
  }

  const userId = tokenPayload.userId;
  const email = tokenPayload.email;
  const role = tokenPayload.role;

  if (
    typeof userId !== 'string' ||
    typeof email !== 'string' ||
    typeof role !== 'string'
  ) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Invalid refresh token payload.',
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      email,
    },
  });

  if (!user) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'User not found. Please log in again.',
    );
  }

  if (!user.isActive || user.deletedAt) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account is inactive. Please contact the Admin.',
    );
  }

  if (user.role !== role) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account role is no longer valid.',
    );
  }

  // CreateNewAccessToken
  const newAccessToken = jwtUtils.createAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    accessToken: newAccessToken,
  };
};

// GetMe
const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    omit: {
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (!user.isActive || user.deletedAt) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account is inactive. Please contact the Admin.',
    );
  }

  return user;
};

// GoogleLogin
const googleLogin = async (payload: IGoogleLoginPayload) => {
  // VerifyGoogleIdToken
  const googlePayload = await googleUtils.verifyGoogleIdToken(payload.idToken);

  // ValidateGoogleEmail
  if (!googlePayload.email) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Google account email was not found!',
    );
  }

  if (googlePayload.email_verified !== true) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Google account email is not verified!',
    );
  }

  const email = googlePayload.email;

  // FindExistingUser
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // ValidateExistingUser
  if (existingUser) {
    if (!existingUser.isActive || existingUser.deletedAt) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Your account is inactive. Please contact the Admin.',
      );
    }
  }

  let user = existingUser;

  // CreateGoogleUser
  if (!user) {
    const firstName = googlePayload.given_name ?? 'Google';
    const lastName = googlePayload.family_name ?? 'User';

    user = await prisma.user.create({
      data: {
        email,
        passwordHash: null,
        firstName,
        lastName,
        role: 'STUDENT',
      },
    });
  }

  // TokenPayload
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  // CreateAccessToken
  const accessToken = jwtUtils.createAccessToken(tokenPayload);

  // CreateRefreshToken
  const refreshToken = jwtUtils.createRefreshToken(tokenPayload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
    },
  };
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  googleLogin,
};
