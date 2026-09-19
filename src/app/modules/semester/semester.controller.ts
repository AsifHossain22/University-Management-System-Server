import httpStatus from "http-status";
import type { Request, Response } from "express";
import { SemesterService } from "./semester.service.ts";
import {
	createSemesterSchema,
	semesterQuerySchema,
	updateSemesterSchema,
} from "./semester.validation.ts";
import { AppError } from "../../utils/AppError.ts";

// CreateSemester
const createSemester = async (req: Request, res: Response) => {
	const payload = createSemesterSchema.parse(req.body);

	const result = await SemesterService.createSemester(payload);

	res.status(httpStatus.CREATED).json({
		success: true,
		message: "Semester created successfully!",
		data: result,
	});
};

// GetSemesters
const getSemesters = async (req: Request, res: Response) => {
	const query = semesterQuerySchema.parse(req.query);

	const result = await SemesterService.getSemesters(query);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Semesters retrieved successfully!",
		data: result,
	});
};

// GetSemesterById
const getSemesterById = async (req: Request, res: Response) => {
	const semesterId = req.params.id;

	if (!semesterId || Array.isArray(semesterId)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid semester ID!");
	}

	const result = await SemesterService.getSemesterById(semesterId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Semester retrieved successfully!",
		data: result,
	});
};

// UpdateSemester
const updateSemester = async (req: Request, res: Response) => {
	const semesterId = req.params.id;

	if (!semesterId || Array.isArray(semesterId)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid semester ID!");
	}

	const payload = updateSemesterSchema.parse(req.body);

	const result = await SemesterService.updateSemester(semesterId, payload);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Semester updated successfully!",
		data: result,
	});
};

// SoftDeleteSemester
const softDeleteSemester = async (req: Request, res: Response) => {
	const semesterId = req.params.id;

	if (!semesterId || Array.isArray(semesterId)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid semester ID!");
	}

	const result = await SemesterService.softDeleteSemester(semesterId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Semester deleted successfully!",
		data: result,
	});
};

export const SemesterController = {
	createSemester,
	getSemesters,
	getSemesterById,
	updateSemester,
	softDeleteSemester,
};
