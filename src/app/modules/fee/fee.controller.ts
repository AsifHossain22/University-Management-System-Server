import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import type {
  CreateFeeInput,
  FeeQueryInput,
  UpdateFeeInput,
} from './fee.validation.ts';
import { FeeService } from './fee.service.ts';

// CreateFee
const createFee = async (req: Request, res: Response) => {
  const payload = req.body as CreateFeeInput;

  const result = await FeeService.createFee(payload);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Fee created successfully!',
    data: result,
  });
};

// GetAllFees
const getAllFees = async (req: Request, res: Response) => {
  const query = res.locals.query as FeeQueryInput;

  const result = await FeeService.getAllFees(query);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Fees retrieved successfully!',
    data: result,
  });
};

// GetMyFees
const getMyFees = async (req: Request, res: Response) => {
  const query = res.locals.query as FeeQueryInput;

  const result = await FeeService.getMyFees(req.user!.userId, query);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Your fees retrieved successfully!',
    data: result,
  });
};

// GetSingleFee
const getSingleFee = async (req: Request, res: Response) => {
  const { feeId } = req.params;

  if (!feeId || Array.isArray(feeId)) {
    throw new Error('Fee ID is required!');
  }

  const isAdmin = req.user!.role === 'ADMIN';

  const result = await FeeService.getSingleFee(
    feeId,
    req.user!.userId,
    isAdmin,
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Fee retrieved successfully!',
    data: result,
  });
};

// UpdateFee
const updateFee = async (req: Request, res: Response) => {
  const { feeId } = req.params;

  if (!feeId || Array.isArray(feeId)) {
    throw new Error('Fee ID is required!');
  }

  const payload = req.body as UpdateFeeInput;

  const result = await FeeService.updateFee(feeId, payload);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Fee updated successfully!',
    data: result,
  });
};

// DeleteFee
const deleteFee = async (req: Request, res: Response) => {
  const { feeId } = req.params;

  if (!feeId || Array.isArray(feeId)) {
    throw new Error('Fee ID is required!');
  }

  await FeeService.deleteFee(feeId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Fee deleted successfully!',
    data: null,
  });
};

export const FeeController = {
  createFee,
  getAllFees,
  getMyFees,
  getSingleFee,
  updateFee,
  deleteFee,
};
