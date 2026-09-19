import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.ts";
import { auth } from "../../middlewares/checkAuth.ts";
import { CoursePrerequisiteController } from "./course-prerequisite.controller.ts";

const router = Router();

// OnlyAdminCanCreatePrerequisite
router.post(
	"/",
	auth(UserRole.ADMIN),
	CoursePrerequisiteController.createCoursePrerequisite,
);

// AllAuthenticatedRolesCanViewPrerequisite
router.get(
	"/",
	auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.INSTRUCTOR),
	CoursePrerequisiteController.getCoursePrerequisites,
);

// GetAllPrerequisitesForSpecificCourse
router.get(
	"/course/:courseId",
	auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.INSTRUCTOR),
	CoursePrerequisiteController.getCoursePrerequisitesByCourseId,
);

// OnlyAdminCanRemovePrerequisite
router.delete(
	"/:id",
	auth(UserRole.ADMIN),
	CoursePrerequisiteController.deleteCoursePrerequisite,
);

export const CoursePrerequisiteRoutes = router;
