import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import multer from 'multer';
import { Prisma } from '../../generated/prisma/client.ts';
import { ZodError } from 'zod';
import config from '../config/index.ts';
import { AppError } from './AppError.ts';

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (config.node_env === 'development') {
    console.error('Error from Global Error Handler:', err);
  }

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage = 'Internal Server Error';

  const errors: unknown[] = [];

  if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage = 'Validation failed';

    errors.push(
      ...err.issues.map(issue => ({
        path: issue.path,
        message: issue.message,
      })),
    );
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  } else if (err instanceof multer.MulterError) {
    statusCode = httpStatus.BAD_REQUEST;

    if (err.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'File size is too large. Maximum allowed size is 2 MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      errorMessage = 'Unexpected file field.';
    } else {
      errorMessage = err.message;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage =
      'You have provided an incorrect field type or missing fields.';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = httpStatus.CONFLICT;
      errorMessage = 'Duplicate key error.';
    } else if (err.code === 'P2003') {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = 'Foreign key constraint failed.';
    } else if (err.code === 'P2025') {
      statusCode = httpStatus.NOT_FOUND;
      errorMessage =
        'An operation failed because the required record was not found.';
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === 'P1000' || err.errorCode === 'P1001') {
      statusCode = httpStatus.SERVICE_UNAVAILABLE;
      errorMessage = 'Database service is currently unavailable.';
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    errorMessage = 'Error occurred during query execution.';
  } else if (err instanceof Error) {
    errorMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    errors,
  });
};
