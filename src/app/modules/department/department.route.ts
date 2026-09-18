import { Router } from "express";
import { UserRole } from "../../../generated/prisma/client.ts";
import { validateRequest } from "../../middlewares/validateRequest.ts";
import { DepartmentController } from "./department.controller.ts";
import { auth } from "../../middlewares/checkAuth.ts";
import {
	createDepartmentSchema,
	departmentQuerySchema,
	updateDepartmentSchema,
} from "./department.validation.ts";

const router = Router();

// CreateDepartment
router.post(
	"/",
	auth(UserRole.ADMIN),
	validateRequest(createDepartmentSchema),
	DepartmentController.createDepartment,
);

// GetDepartments
router.get(
	"/",
	auth(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT),
	validateRequest(departmentQuerySchema, "query"),
	DepartmentController.getDepartments,
);

// GetDepartmentById
router.get(
	"/:departmentId",
	auth(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT),
	DepartmentController.getDepartmentById,
);

// UpdateDepartment
router.patch(
	"/:departmentId",
	auth(UserRole.ADMIN),
	validateRequest(updateDepartmentSchema),
	DepartmentController.updateDepartment,
);

// SoftDeleteDepartment
router.delete(
	"/:departmentId",
	auth(UserRole.ADMIN),
	DepartmentController.softDeleteDepartment,
);

export const DepartmentRoutes = router;
