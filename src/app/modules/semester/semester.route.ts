import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.ts";
import { auth } from "../../middlewares/checkAuth.ts";
import { SemesterController } from "./semester.controller.ts";

const router = Router();

// CreateSemester — AdminOnly
router.post("/", auth(UserRole.ADMIN), SemesterController.createSemester);

// GetAllSemesters — Admin | Student | Instructor
router.get(
	"/",
	auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.INSTRUCTOR),
	SemesterController.getSemesters,
);

// GetSemesterByID — Admin | Student | Instructor
router.get(
	"/:id",
	auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.INSTRUCTOR),
	SemesterController.getSemesterById,
);

// UpdateSemester — AdminOnly
router.patch("/:id", auth(UserRole.ADMIN), SemesterController.updateSemester);

// SoftDeleteSemester — AdminOnly
router.delete(
	"/:id",
	auth(UserRole.ADMIN),
	SemesterController.softDeleteSemester,
);

export const SemesterRoutes = router;
