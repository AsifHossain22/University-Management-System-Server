import httpStatus from "http-status";
import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError.ts";
import { CoursePrerequisiteService } from "./course-prerequisite.service.ts";
import {
	coursePrerequisiteQuerySchema,
	createCoursePrerequisiteSchema,
} from "./course-prerequisite.validation.ts";

// CreateCoursePrerequisite
const createCoursePrerequisite = async (req: Request, res: Response) => {
	const payload = createCoursePrerequisiteSchema.parse(req.body);

	const result =
		await CoursePrerequisiteService.createCoursePrerequisite(payload);

	res.status(httpStatus.CREATED).json({
		success: true,
		message: "Course prerequisite created successfully!",
		data: result,
	});
};

// GetCoursePrerequisites
const getCoursePrerequisites = async (req: Request, res: Response) => {
	const query = coursePrerequisiteQuerySchema.parse(req.query);

	const result = await CoursePrerequisiteService.getCoursePrerequisites(query);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Course prerequisites retrieved successfully!",
		data: result,
	});
};

// GetCoursePrerequisitesByCourseId
const getCoursePrerequisitesByCourseId = async (
	req: Request,
	res: Response,
) => {
	const courseId = req.params.courseId;

	if (!courseId || Array.isArray(courseId)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid course ID!");
	}

	const result =
		await CoursePrerequisiteService.getCoursePrerequisitesByCourseId(courseId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Course prerequisites retrieved successfully!",
		data: result,
	});
};

// DeleteCoursePrerequisite
const deleteCoursePrerequisite = async (req: Request, res: Response) => {
	const relationshipId = req.params.id;

	if (!relationshipId || Array.isArray(relationshipId)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Invalid prerequisite relationship ID!",
		);
	}

	const result =
		await CoursePrerequisiteService.deleteCoursePrerequisite(relationshipId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Course prerequisite deleted successfully!",
		data: result,
	});
};

export const CoursePrerequisiteController = {
	createCoursePrerequisite,
	getCoursePrerequisites,
	getCoursePrerequisitesByCourseId,
	deleteCoursePrerequisite,
};
