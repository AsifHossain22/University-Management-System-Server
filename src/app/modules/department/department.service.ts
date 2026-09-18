import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma.ts";
import { AppError } from "../../utils/AppError.ts";
import type {
	CreateDepartmentInput,
	DepartmentQueryInput,
	UpdateDepartmentInput,
} from "./department.validation.ts";

// CreateDepartment
const createDepartment = async (payload: CreateDepartmentInput) => {
	const existingDepartment = await prisma.department.findFirst({
		where: {
			code: payload.code,
			deletedAt: null,
		},
	});

	if (existingDepartment) {
		throw new AppError(
			httpStatus.CONFLICT,
			"A department with this code already exists!",
		);
	}

	const department = await prisma.department.create({
		data: {
			name: payload.name,
			code: payload.code,
			...(payload.description !== undefined && {
				description: payload.description,
			}),
		},
	});

	return department;
};

// GetDepartments
const getDepartments = async (query: DepartmentQueryInput) => {
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

	const [departments, total] = await prisma.$transaction([
		prisma.department.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortOrder,
			},
		}),
		prisma.department.count({
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
		data: departments,
	};
};

// GetDepartmentById
const getDepartmentById = async (departmentId: string) => {
	const department = await prisma.department.findFirst({
		where: {
			id: departmentId,
			deletedAt: null,
		},
		include: {
			programs: {
				where: {
					deletedAt: null,
				},
				select: {
					id: true,
					name: true,
					code: true,
					isActive: true,
				},
			},
		},
	});

	if (!department) {
		throw new AppError(httpStatus.NOT_FOUND, "Department not found!");
	}

	return department;
};

// UpdateDepartment
const updateDepartment = async (
	departmentId: string,
	payload: UpdateDepartmentInput,
) => {
	const existingDepartment = await prisma.department.findFirst({
		where: {
			id: departmentId,
			deletedAt: null,
		},
	});

	if (!existingDepartment) {
		throw new AppError(httpStatus.NOT_FOUND, "Department not found!");
	}

	if (payload.code !== undefined && payload.code !== existingDepartment.code) {
		const duplicateDepartment = await prisma.department.findFirst({
			where: {
				code: payload.code,
				deletedAt: null,
				id: {
					not: departmentId,
				},
			},
		});

		if (duplicateDepartment) {
			throw new AppError(
				httpStatus.CONFLICT,
				"A department with this code already exists!",
			);
		}
	}

	const department = await prisma.department.update({
		where: {
			id: departmentId,
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
			...(payload.isActive !== undefined && {
				isActive: payload.isActive,
			}),
		},
	});

	return department;
};

// SoftDeleteDepartment
const softDeleteDepartment = async (departmentId: string) => {
	const existingDepartment = await prisma.department.findFirst({
		where: {
			id: departmentId,
			deletedAt: null,
		},
	});

	if (!existingDepartment) {
		throw new AppError(httpStatus.NOT_FOUND, "Department not found!");
	}

	const department = await prisma.department.update({
		where: {
			id: departmentId,
		},
		data: {
			deletedAt: new Date(),
			isActive: false,
		},
	});

	return department;
};

export const DepartmentService = {
	createDepartment,
	getDepartments,
	getDepartmentById,
	updateDepartment,
	softDeleteDepartment,
};
