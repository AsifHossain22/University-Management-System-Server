import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma.ts";
import { AppError } from "../../utils/AppError.ts";

import type {
	CourseQueryInput,
	CreateCourseInput,
	UpdateCourseInput,
} from "./course.validation.ts";

// CreateCourse
const createCourse = async (payload: CreateCourseInput) => {
	const department = await prisma.department.findFirst({
		where: {
			id: payload.departmentId,
			deletedAt: null,
		},
	});

	if (!department) {
		throw new AppError(httpStatus.NOT_FOUND, "Department not found!");
	}

	const program = await prisma.program.findFirst({
		where: {
			id: payload.programId,
			deletedAt: null,
		},
	});

	if (!program) {
		throw new AppError(httpStatus.NOT_FOUND, "Program not found!");
	}

	if (program.departmentId !== payload.departmentId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"The selected program does not belong to the selected department!",
		);
	}

	const existingCourse = await prisma.course.findFirst({
		where: {
			code: payload.code,
			deletedAt: null,
		},
	});

	if (existingCourse) {
		throw new AppError(
			httpStatus.CONFLICT,
			"A course with this code already exists!",
		);
	}

	const course = await prisma.course.create({
		data: {
			name: payload.name,
			code: payload.code,
			credits: payload.credits,
			departmentId: payload.departmentId,
			programId: payload.programId,
			...(payload.description !== undefined && {
				description: payload.description,
			}),
		},
	});

	return course;
};

// GetCourses
const getCourses = async (query: CourseQueryInput) => {
	const {
		searchTerm,
		departmentId,
		programId,
		isActive,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = query;

	const skip = (page - 1) * limit;

	const where = {
		deletedAt: null,

		...(searchTerm
			? {
					OR: [
						{
							name: {
								contains: searchTerm,
								mode: "insensitive" as const,
							},
						},
						{
							code: {
								contains: searchTerm,
								mode: "insensitive" as const,
							},
						},
					],
				}
			: {}),

		...(departmentId ? { departmentId } : {}),

		...(programId ? { programId } : {}),

		...(isActive !== undefined ? { isActive } : {}),
	};

	const [courses, total] = await prisma.$transaction([
		prisma.course.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortOrder,
			},
		}),

		prisma.course.count({
			where,
		}),
	]);

	const totalPages = Math.ceil(total / limit);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages,
		},
		data: courses,
	};
};

// GetCourseById
const getCourseById = async (courseId: string) => {
	const course = await prisma.course.findFirst({
		where: {
			id: courseId,
			deletedAt: null,
		},

		include: {
			department: {
				select: {
					id: true,
					name: true,
					code: true,
					isActive: true,
				},
			},

			program: {
				select: {
					id: true,
					name: true,
					code: true,
					departmentId: true,
					isActive: true,
				},
			},

			prerequisites: {
				include: {
					prerequisite: {
						select: {
							id: true,
							name: true,
							code: true,
							credits: true,
							isActive: true,
						},
					},
				},
			},
		},
	});

	if (!course) {
		throw new AppError(httpStatus.NOT_FOUND, "Course not found!");
	}

	return course;
};

// UpdateCourse
const updateCourse = async (courseId: string, payload: UpdateCourseInput) => {
	const existingCourse = await prisma.course.findFirst({
		where: {
			id: courseId,
			deletedAt: null,
		},
	});

	if (!existingCourse) {
		throw new AppError(httpStatus.NOT_FOUND, "Course not found!");
	}

	if (payload.code !== undefined && payload.code !== existingCourse.code) {
		const duplicateCourse = await prisma.course.findFirst({
			where: {
				code: payload.code,
				deletedAt: null,
				id: {
					not: courseId,
				},
			},
		});

		if (duplicateCourse) {
			throw new AppError(
				httpStatus.CONFLICT,
				"A course with this code already exists!",
			);
		}
	}

	const nextDepartmentId = payload.departmentId ?? existingCourse.departmentId;

	const nextProgramId = payload.programId ?? existingCourse.programId;

	if (payload.departmentId !== undefined || payload.programId !== undefined) {
		const department = await prisma.department.findFirst({
			where: {
				id: nextDepartmentId,
				deletedAt: null,
			},
		});

		if (!department) {
			throw new AppError(httpStatus.NOT_FOUND, "Department not found!");
		}

		const program = await prisma.program.findFirst({
			where: {
				id: nextProgramId,
				deletedAt: null,
			},
		});

		if (!program) {
			throw new AppError(httpStatus.NOT_FOUND, "Program not found!");
		}

		if (program.departmentId !== nextDepartmentId) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"The selected program does not belong to the selected department!",
			);
		}
	}

	const course = await prisma.course.update({
		where: {
			id: courseId,
		},

		data: {
			...(payload.name !== undefined && {
				name: payload.name,
			}),

			...(payload.code !== undefined && {
				code: payload.code,
			}),

			...(payload.description !== undefined && {
				description: payload.description,
			}),

			...(payload.credits !== undefined && {
				credits: payload.credits,
			}),

			...(payload.departmentId !== undefined && {
				departmentId: payload.departmentId,
			}),

			...(payload.programId !== undefined && {
				programId: payload.programId,
			}),

			...(payload.isActive !== undefined && {
				isActive: payload.isActive,
			}),
		},
	});

	return course;
};

// SoftDeleteCourse
const softDeleteCourse = async (courseId: string) => {
	const existingCourse = await prisma.course.findFirst({
		where: {
			id: courseId,
			deletedAt: null,
		},
	});

	if (!existingCourse) {
		throw new AppError(httpStatus.NOT_FOUND, "Course not found!");
	}

	const course = await prisma.course.update({
		where: {
			id: courseId,
		},

		data: {
			deletedAt: new Date(),
			isActive: false,
		},
	});

	return course;
};

export const CourseService = {
	createCourse,
	getCourses,
	getCourseById,
	updateCourse,
	softDeleteCourse,
};
