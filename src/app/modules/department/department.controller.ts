import httpStatus from "http-status";
import type { Request, Response } from "express";
import { DepartmentService } from "./department.service.ts";
import type { DepartmentQueryInput } from "./department.validation.ts";

// CreateDepartment
const createDepartment = async (req: Request, res: Response) => {
	const result = await DepartmentService.createDepartment(req.body);

	res.status(httpStatus.CREATED).json({
		success: true,
		message: "Department created successfully!",
		data: result,
	});
};

// GetDepartments
const getDepartments = async (req: Request, res: Response) => {
	const query = res.locals.query as DepartmentQueryInput;

	const result = await DepartmentService.getDepartments(query);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Departments retrieved successfully!",
		data: result.data,
		meta: result.meta,
	});
};

// GetDepartmentById
const getDepartmentById = async (
	req: Request<{ departmentId: string }>,
	res: Response,
) => {
	const result = await DepartmentService.getDepartmentById(
		req.params.departmentId,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Department retrieved successfully!",
		data: result,
	});
};

// UpdateDepartment
const updateDepartment = async (
	req: Request<{ departmentId: string }>,
	res: Response,
) => {
	const result = await DepartmentService.updateDepartment(
		req.params.departmentId,
		req.body,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Department updated successfully!",
		data: result,
	});
};

// SoftDeleteDepartment
const softDeleteDepartment = async (
	req: Request<{ departmentId: string }>,
	res: Response,
) => {
	const result = await DepartmentService.softDeleteDepartment(
		req.params.departmentId,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Department deleted successfully!",
		data: result,
	});
};

export const DepartmentController = {
	createDepartment,
	getDepartments,
	getDepartmentById,
	updateDepartment,
	softDeleteDepartment,
};
