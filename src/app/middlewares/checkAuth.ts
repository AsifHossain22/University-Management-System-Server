import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { z } from 'zod';
import type { UserRole } from '../../generated/prisma/enums.ts';
import { prisma } from '../../lib/prisma.ts';
import { AppError } from '../utils/AppError.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { jwtUtils } from '../utils/jwt.ts';

const jwtPayloadSchema = z.object({
  userId: z.string().min(1),
  email: z.email(),
  role: z.enum(['ADMIN', 'STUDENT', 'INSTRUCTOR']),
});

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

    const verifiedToken = jwtUtils.verifyAccessToken(token);

    if (!verifiedToken.success) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'Invalid or expired access token.',
      );
    }

    const payloadResult = jwtPayloadSchema.safeParse(verifiedToken.data);

    if (!payloadResult.success) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid access token.');
    }

    const { userId, email, role } = payloadResult.data;

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
        'Your account is inactive. Please contact the Admin.',
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
