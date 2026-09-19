import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma.ts";
import { AppError } from "../../utils/AppError.ts";

import type {
	CreateSemesterInput,
	SemesterQueryInput,
	UpdateSemesterInput,
} from "./semester.validation.ts";

// CreateSemester
const createSemester = async (payload: CreateSemesterInput) => {
	const existingSemester = await prisma.semester.findFirst({
		where: {
			code: payload.code,
			deletedAt: null,
		},
	});

	if (existingSemester) {
		throw new AppError(
			httpStatus.CONFLICT,
			"A semester with this code already exists!",
		);
	}

	const semester = await prisma.semester.create({
		data: {
			name: payload.name,
			code: payload.code,
			startDate: payload.startDate,
			endDate: payload.endDate,
		},
	});

	return semester;
};

// GetSemesters
const getSemesters = async (query: SemesterQueryInput) => {
	const {
		searchTerm,
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
		...(isActive !== undefined ? { isActive } : {}),
	};

	const [semesters, total] = await prisma.$transaction([
		prisma.semester.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortOrder,
			},
		}),
		prisma.semester.count({ where }),
	]);

	const totalPages = Math.ceil(total / limit);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages,
		},
		data: semesters,
	};
};

// GetSemesterById
const getSemesterById = async (semesterId: string) => {
	const semester = await prisma.semester.findFirst({
		where: {
			id: semesterId,
			deletedAt: null,
		},
		include: {
			sections: {
				where: {
					deletedAt: null,
				},
				select: {
					id: true,
					name: true,
					code: true,
					courseId: true,
					instructorId: true,
					capacity: true,
					isActive: true,
				},
			},
		},
	});

	if (!semester) {
		throw new AppError(httpStatus.NOT_FOUND, "Semester not found!");
	}

	return semester;
};

// UpdateSemester
const updateSemester = async (
	semesterId: string,
	payload: UpdateSemesterInput,
) => {
	const existingSemester = await prisma.semester.findFirst({
		where: {
			id: semesterId,
			deletedAt: null,
		},
	});

	if (!existingSemester) {
		throw new AppError(httpStatus.NOT_FOUND, "Semester not found!");
	}

	if (payload.code !== undefined && payload.code !== existingSemester.code) {
		const duplicateSemester = await prisma.semester.findFirst({
			where: {
				code: payload.code,
				deletedAt: null,
				id: {
					not: semesterId,
				},
			},
		});

		if (duplicateSemester) {
			throw new AppError(
				httpStatus.CONFLICT,
				"A semester with this code already exists!",
			);
		}
	}

	const nextStartDate = payload.startDate ?? existingSemester.startDate;
	const nextEndDate = payload.endDate ?? existingSemester.endDate;

	if (nextStartDate >= nextEndDate) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Start date must be earlier than end date!",
		);
	}

	const semester = await prisma.semester.update({
		where: {
			id: semesterId,
		},
		data: {
			...(payload.name !== undefined && {
				name: payload.name,
			}),
			...(payload.code !== undefined && {
				code: payload.code,
			}),
			...(payload.startDate !== undefined && {
				startDate: payload.startDate,
			}),
			...(payload.endDate !== undefined && {
				endDate: payload.endDate,
			}),
			...(payload.isActive !== undefined && {
				isActive: payload.isActive,
			}),
		},
	});

	return semester;
};

// SoftDeleteSemester
const softDeleteSemester = async (semesterId: string) => {
	const existingSemester = await prisma.semester.findFirst({
		where: {
			id: semesterId,
			deletedAt: null,
		},
	});

	if (!existingSemester) {
		throw new AppError(httpStatus.NOT_FOUND, "Semester not found!");
	}

	const semester = await prisma.semester.update({
		where: {
			id: semesterId,
		},
		data: {
			deletedAt: new Date(),
			isActive: false,
		},
	});

	return semester;
};

export const SemesterService = {
	createSemester,
	getSemesters,
	getSemesterById,
	updateSemester,
	softDeleteSemester,
};
