import httpStatus from "http-status";
import type { Request, Response } from "express";
import { CourseService } from "./course.service.ts";
import type { CourseQueryInput } from "./course.validation.ts";

// CreateCourse
const createCourse = async (req: Request, res: Response) => {
	const result = await CourseService.createCourse(req.body);

	res.status(httpStatus.CREATED).json({
		success: true,
		message: "Course created successfully!",
		data: result,
	});
};

// GetCourses
const getCourses = async (req: Request, res: Response) => {
	const query = res.locals.query as CourseQueryInput;

	const result = await CourseService.getCourses(query);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Courses retrieved successfully!",
		data: result.data,
		meta: result.meta,
	});
};

// GetCourseById
const getCourseById = async (
	req: Request<{ courseId: string }>,
	res: Response,
) => {
	const result = await CourseService.getCourseById(req.params.courseId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Course retrieved successfully!",
		data: result,
	});
};

// UpdateCourse
const updateCourse = async (
	req: Request<{ courseId: string }>,
	res: Response,
) => {
	const result = await CourseService.updateCourse(
		req.params.courseId,
		req.body,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Course updated successfully!",
		data: result,
	});
};

// SoftDeleteCourse
const softDeleteCourse = async (
	req: Request<{ courseId: string }>,
	res: Response,
) => {
	const result = await CourseService.softDeleteCourse(req.params.courseId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Course deleted successfully!",
		data: result,
	});
};

export const CourseController = {
	createCourse,
	getCourses,
	getCourseById,
	updateCourse,
	softDeleteCourse,
};
