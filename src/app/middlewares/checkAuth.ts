import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';
import type { UserRole } from '../../generated/prisma/enums.ts';
import config from '../config/index.ts';
import { AppError } from '../utils/AppError.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { jwtUtils } from '../utils/jwt.ts';
import { prisma } from '../../lib/prisma.ts';

export interface RequestUser {
  email: string;
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export const auth = (...requiredRoles: UserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'You are not logged in. Please log in to access this resource.',
      );
    }

    const token = authorizationHeader.split(' ')[1];

    if (!token) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'You are not logged in. Please log in to access this resource.',
      );
    }

    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verifiedToken.success) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'Invalid or expired access token.',
      );
    }

    const { userId, email, role } = verifiedToken.data as JwtPayload;

    if (!userId || !email || !role) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid access token.');
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(role as UserRole)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Forbidden. You do not have permission to access this resource.',
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
        'Your account is inactive. Please contact the administrator.',
      );
    }

    if (user.role !== role) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Your account role is no longer valid.',
      );
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  });
};
