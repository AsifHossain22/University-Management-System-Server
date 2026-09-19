import httpStatus from "http-status";
import type { Request, Response } from "express";
import { ProgramService } from "./program.service.ts";
import type { ProgramQueryInput } from "./program.validation.ts";

// CreateProgram
const createProgram = async (req: Request, res: Response) => {
	const result = await ProgramService.createProgram(req.body);

	res.status(httpStatus.CREATED).json({
		success: true,
		message: "Program created successfully!",
		data: result,
	});
};

// GetPrograms
const getPrograms = async (req: Request, res: Response) => {
	const query = res.locals.query as ProgramQueryInput;

	const result = await ProgramService.getPrograms(query);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Programs retrieved successfully!",
		data: result.data,
		meta: result.meta,
	});
};

// GetProgramById
const getProgramById = async (
	req: Request<{ programId: string }>,
	res: Response,
) => {
	const result = await ProgramService.getProgramById(req.params.programId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Program retrieved successfully!",
		data: result,
	});
};

// UpdateProgram
const updateProgram = async (
	req: Request<{ programId: string }>,
	res: Response,
) => {
	const result = await ProgramService.updateProgram(
		req.params.programId,
		req.body,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Program updated successfully!",
		data: result,
	});
};

// SoftDeleteProgram
const softDeleteProgram = async (
	req: Request<{ programId: string }>,
	res: Response,
) => {
	const result = await ProgramService.softDeleteProgram(req.params.programId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Program deleted successfully!",
		data: result,
	});
};

export const ProgramController = {
	createProgram,
	getPrograms,
	getProgramById,
	updateProgram,
	softDeleteProgram,
};
