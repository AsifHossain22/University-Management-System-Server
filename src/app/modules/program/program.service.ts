import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma.ts";
import { AppError } from "../../utils/AppError.ts";

import type {
	CreateProgramInput,
	ProgramQueryInput,
	UpdateProgramInput,
} from "./program.validation.ts";

// CreateProgram
const createProgram = async (payload: CreateProgramInput) => {
	const department = await prisma.department.findFirst({
		where: {
			id: payload.departmentId,
			deletedAt: null,
		},
	});

	if (!department) {
		throw new AppError(httpStatus.NOT_FOUND, "Department not found!");
	}

	const existingProgram = await prisma.program.findFirst({
		where: {
			code: payload.code,
			deletedAt: null,
		},
	});

	if (existingProgram) {
		throw new AppError(
			httpStatus.CONFLICT,
			"A program with this code already exists!",
		);
	}

	const program = await prisma.program.create({
		data: {
			name: payload.name,
			code: payload.code,
			departmentId: payload.departmentId,
			...(payload.description !== undefined && {
				description: payload.description,
			}),
		},
	});

	return program;
};

// GetPrograms
const getPrograms = async (query: ProgramQueryInput) => {
	const {
		searchTerm,
		departmentId,
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
		...(isActive !== undefined ? { isActive } : {}),
	};

	const [programs, total] = await prisma.$transaction([
		prisma.program.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortOrder,
			},
		}),
		prisma.program.count({
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
		data: programs,
	};
};

// GetProgramById
const getProgramById = async (programId: string) => {
	const program = await prisma.program.findFirst({
		where: {
			id: programId,
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
			courses: {
				where: {
					deletedAt: null,
				},
				select: {
					id: true,
					name: true,
					code: true,
					credits: true,
					isActive: true,
				},
			},
		},
	});

	if (!program) {
		throw new AppError(httpStatus.NOT_FOUND, "Program not found!");
	}

	return program;
};

// UpdateProgram
const updateProgram = async (
	programId: string,
	payload: UpdateProgramInput,
) => {
	const existingProgram = await prisma.program.findFirst({
		where: {
			id: programId,
			deletedAt: null,
		},
	});

	if (!existingProgram) {
		throw new AppError(httpStatus.NOT_FOUND, "Program not found!");
	}

	if (payload.code !== undefined && payload.code !== existingProgram.code) {
		const duplicateProgram = await prisma.program.findFirst({
			where: {
				code: payload.code,
				deletedAt: null,
				id: {
					not: programId,
				},
			},
		});

		if (duplicateProgram) {
			throw new AppError(
				httpStatus.CONFLICT,
				"A program with this code already exists!",
			);
		}
	}

	if (
		payload.departmentId !== undefined &&
		payload.departmentId !== existingProgram.departmentId
	) {
		const department = await prisma.department.findFirst({
			where: {
				id: payload.departmentId,
				deletedAt: null,
			},
		});

		if (!department) {
			throw new AppError(httpStatus.NOT_FOUND, "Department not found!");
		}
	}

	const program = await prisma.program.update({
		where: {
			id: programId,
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
			...(payload.departmentId !== undefined && {
				departmentId: payload.departmentId,
			}),
			...(payload.isActive !== undefined && {
				isActive: payload.isActive,
			}),
		},
	});

	return program;
};

// SoftDeleteProgram
const softDeleteProgram = async (programId: string) => {
	const existingProgram = await prisma.program.findFirst({
		where: {
			id: programId,
			deletedAt: null,
		},
	});

	if (!existingProgram) {
		throw new AppError(httpStatus.NOT_FOUND, "Program not found!");
	}

	const program = await prisma.program.update({
		where: {
			id: programId,
		},
		data: {
			deletedAt: new Date(),
			isActive: false,
		},
	});

	return program;
};

export const ProgramService = {
	createProgram,
	getPrograms,
	getProgramById,
	updateProgram,
	softDeleteProgram,
};
