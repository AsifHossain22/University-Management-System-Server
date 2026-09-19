import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma.ts";
import { AppError } from "../../utils/AppError.ts";
import type {
	CreateCoursePrerequisiteInput,
	CoursePrerequisiteQueryInput,
} from "./course-prerequisite.validation.ts";

// CreateCoursePrerequisite
const createCoursePrerequisite = async (
	payload: CreateCoursePrerequisiteInput,
) => {
	const { courseId, prerequisiteId } = payload;

	// MainCourseMustExistsAndActive.
	const course = await prisma.course.findFirst({
		where: {
			id: courseId,
			isActive: true,
			deletedAt: null,
		},
	});

	if (!course) {
		throw new AppError(httpStatus.NOT_FOUND, "Course not found!");
	}

	// PrerequisiteCourseMustExistsAndActive.
	const prerequisiteCourse = await prisma.course.findFirst({
		where: {
			id: prerequisiteId,
			isActive: true,
			deletedAt: null,
		},
	});

	if (!prerequisiteCourse) {
		throw new AppError(httpStatus.NOT_FOUND, "Prerequisite course not found!");
	}

	// PreventDuplicatePrerequisiteRelationships
	const existingRelationship = await prisma.coursePrerequisite.findFirst({
		where: {
			courseId,
			prerequisiteId,
		},
	});

	if (existingRelationship) {
		throw new AppError(
			httpStatus.CONFLICT,
			"This prerequisite relationship already exists!",
		);
	}

	return prisma.coursePrerequisite.create({
		data: {
			courseId,
			prerequisiteId,
		},
		include: {
			course: {
				select: {
					id: true,
					name: true,
					code: true,
					credits: true,
				},
			},
			prerequisite: {
				select: {
					id: true,
					name: true,
					code: true,
					credits: true,
				},
			},
		},
	});
};

// GetCoursePrerequisites
const getCoursePrerequisites = async (query: CoursePrerequisiteQueryInput) => {
	const {
		courseId,
		prerequisiteId,
		page = 1,
		limit = 10,
		sortOrder = "desc",
	} = query;

	const skip = (page - 1) * limit;

	const where = {
		...(courseId ? { courseId } : {}),
		...(prerequisiteId ? { prerequisiteId } : {}),
	};

	const [relationships, total] = await prisma.$transaction([
		prisma.coursePrerequisite.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				createdAt: sortOrder,
			},
			include: {
				course: {
					select: {
						id: true,
						name: true,
						code: true,
						credits: true,
					},
				},
				prerequisite: {
					select: {
						id: true,
						name: true,
						code: true,
						credits: true,
					},
				},
			},
		}),
		prisma.coursePrerequisite.count({
			where,
		}),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: relationships,
	};
};

// GetCoursePrerequisitesByCourseId
const getCoursePrerequisitesByCourseId = async (courseId: string) => {
	const course = await prisma.course.findFirst({
		where: {
			id: courseId,
			deletedAt: null,
		},
		select: {
			id: true,
			name: true,
			code: true,
			credits: true,
		},
	});

	if (!course) {
		throw new AppError(httpStatus.NOT_FOUND, "Course not found!");
	}

	return prisma.coursePrerequisite.findMany({
		where: {
			courseId,
		},
		orderBy: {
			createdAt: "desc",
		},
		include: {
			prerequisite: {
				select: {
					id: true,
					name: true,
					code: true,
					credits: true,
				},
			},
		},
	});
};

// DeleteCoursePrerequisite
const deleteCoursePrerequisite = async (relationshipId: string) => {
	const relationship = await prisma.coursePrerequisite.findUnique({
		where: {
			id: relationshipId,
		},
	});

	if (!relationship) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Course prerequisite relationship not found!",
		);
	}

	return prisma.coursePrerequisite.delete({
		where: {
			id: relationshipId,
		},
	});
};

export const CoursePrerequisiteService = {
	createCoursePrerequisite,
	getCoursePrerequisites,
	getCoursePrerequisitesByCourseId,
	deleteCoursePrerequisite,
};
