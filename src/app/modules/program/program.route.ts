import { Router } from "express";
import { UserRole } from "../../../generated/prisma/client.ts";
import { auth } from "../../middlewares/checkAuth.ts";
import { validateRequest } from "../../middlewares/validateRequest.ts";
import { ProgramController } from "./program.controller.ts";
import {
	createProgramSchema,
	programQuerySchema,
	updateProgramSchema,
} from "./program.validation.ts";

const router = Router();

// CreateProgram
router.post(
	"/",
	auth(UserRole.ADMIN),
	validateRequest(createProgramSchema),
	ProgramController.createProgram,
);

// GetPrograms
router.get(
	"/",
	auth(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT),
	validateRequest(programQuerySchema, "query"),
	ProgramController.getPrograms,
);

// GetProgramById
router.get(
	"/:programId",
	auth(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT),
	ProgramController.getProgramById,
);

// UpdateProgram
router.patch(
	"/:programId",
	auth(UserRole.ADMIN),
	validateRequest(updateProgramSchema),
	ProgramController.updateProgram,
);

// SoftDeleteProgram
router.delete(
	"/:programId",
	auth(UserRole.ADMIN),
	ProgramController.softDeleteProgram,
);

export const ProgramRoutes = router;
