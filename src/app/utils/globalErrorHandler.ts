import type { NextFunction, Request, Response } from 'express';

import httpStatus from 'http-status';

import { Prisma } from '../../generated/prisma/client.ts';

import config from '../config/index.ts';

import { AppError } from '../utils/AppError.ts';

export const globalErrorHandler = async (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (config.node_env === 'development') {
    console.log('Error from Global Error Handler:', err);
  }

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage = 'Internal Server Error';
  let errors: unknown[] = [];

  if (err instanceof Prisma.PrismaClientValidationError) {
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
    if (err.errorCode === 'P1000') {
      statusCode = httpStatus.UNAUTHORIZED;
      errorMessage = 'Authentication failed against the database server.';
    } else if (err.errorCode === 'P1001') {
      statusCode = httpStatus.SERVICE_UNAVAILABLE;
      errorMessage = "Can't reach the database server.";
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    errorMessage = 'Error occurred during query execution.';
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  } else if (err instanceof Error) {
    errorMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    errors,
  });
};
