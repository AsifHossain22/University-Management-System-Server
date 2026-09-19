import { Router } from "express";
import { UserRole } from "../../../generated/prisma/client.ts";
import { auth } from "../../middlewares/checkAuth.ts";
import { validateRequest } from "../../middlewares/validateRequest.ts";
import { CourseController } from "./course.controller.ts";
import {
	createCourseSchema,
	courseQuerySchema,
	updateCourseSchema,
} from "./course.validation.ts";

const router = Router();

// CreateCourse
router.post(
	"/",
	auth(UserRole.ADMIN),
	validateRequest(createCourseSchema),
	CourseController.createCourse,
);

// GetCourses
router.get(
	"/",
	auth(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT),
	validateRequest(courseQuerySchema, "query"),
	CourseController.getCourses,
);

// GetCourseByID
router.get(
	"/:courseId",
	auth(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT),
	CourseController.getCourseById,
);

// UpdateCourse
router.patch(
	"/:courseId",
	auth(UserRole.ADMIN),
	validateRequest(updateCourseSchema),
	CourseController.updateCourse,
);

// SoftDeleteCourse
router.delete(
	"/:courseId",
	auth(UserRole.ADMIN),
	CourseController.softDeleteCourse,
);

export const CourseRoutes = router;
