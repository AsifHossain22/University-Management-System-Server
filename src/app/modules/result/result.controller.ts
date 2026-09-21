import type { Request, Response } from "express";
import httpStatus from "http-status";
import { ResultService } from "./result.service.ts";
import type {
	CreateResultInput,
	ResultQueryInput,
	UpdateResultInput,
} from "./result.validation.ts";

// CreateResult
const createResult = async (req: Request, res: Response) => {
	const payload = req.body as CreateResultInput;

	const result = await ResultService.createResult(
		req.user!.userId,
		req.user!.role as "ADMIN" | "INSTRUCTOR",
		payload,
	);

	res.status(httpStatus.CREATED).json({
		success: true,
		message: "Result created successfully!",
		data: result,
	});
};

// GetResults
const getResults = async (req: Request, res: Response) => {
	const query = res.locals.query as ResultQueryInput;

	const result = await ResultService.getResults(
		req.user!.userId,
		req.user!.role,
		query,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Results retrieved successfully!",
		data: result.data,
		meta: result.meta,
	});
};

// GetResultById
const getResultById = async (req: Request, res: Response) => {
	const { resultId } = res.locals.params as { resultId: string };

	const result = await ResultService.getResultById(
		req.user!.userId,
		req.user!.role,
		resultId,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Result retrieved successfully!",
		data: result,
	});
};

// UpdateResult
const updateResult = async (req: Request, res: Response) => {
	const { resultId } = res.locals.params as { resultId: string };
	const payload = req.body as UpdateResultInput;

	const result = await ResultService.updateResult(
		req.user!.userId,
		req.user!.role as "ADMIN" | "INSTRUCTOR",
		resultId,
		payload,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Result updated successfully!",
		data: result,
	});
};

// DeleteResult
const deleteResult = async (req: Request, res: Response) => {
	const { resultId } = res.locals.params as { resultId: string };

	await ResultService.deleteResult(resultId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Result deleted successfully!",
		data: null,
	});
};

export const ResultController = {
	createResult,
	getResults,
	getResultById,
	updateResult,
	deleteResult,
};
