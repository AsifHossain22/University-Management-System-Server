import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import httpStatus from "http-status";
import config from "./app/config/index.ts";
import { AuthRoutes } from "./app/modules/auth/auth.route.ts";
import { ExamRoutes } from "./app/modules/exam/exam.route.ts";
import { notFound } from "./app/middlewares/notFound.ts";
import { globalErrorHandler } from "./app/utils/globalErrorHandler.ts";
import { DepartmentRoutes } from "./app/modules/department/department.route.ts";
import { ProgramRoutes } from "./app/modules/program/program.route.ts";
import { CourseRoutes } from "./app/modules/course/course.route.ts";
import { SemesterRoutes } from "./app/modules/semester/semester.route.ts";
import { CoursePrerequisiteRoutes } from "./app/modules/course-prerequisite/course-prerequisite.route.ts";

const app: Application = express();

// SecurityHeaders
app.use(helmet());

// CORS
app.use(
	cors({
		origin: config.client_url,
	}),
);

// ParseURLEncodedFormData
app.use(express.urlencoded({ extended: true }));

// ParseJSONRequestBodies
app.use(express.json());

// AuthRoutes
app.use("/api/v1/auth", AuthRoutes);

// ExamRoutes
app.use("/api/v1/exams", ExamRoutes);

// DepartmentRoutes
app.use("/api/v1/departments", DepartmentRoutes);

// ProgramRoutes
app.use("/api/v1/programs", ProgramRoutes);

// CourseRoutes
app.use("/api/v1/courses", CourseRoutes);

// SemesterRoutes
app.use("/api/v1/semesters", SemesterRoutes);

// CoursePrerequisiteRoutes
app.use("/api/v1/course-prerequisites", CoursePrerequisiteRoutes);

// WelcomeRoute
app.get("/", (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to University Management System Server!",
		data: null,
	});
});

// GlobalErrorHandler
app.use(globalErrorHandler);

// NotFound
app.use(notFound);

export default app;
