import cors from 'cors';
import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import helmet from 'helmet';
import httpStatus from 'http-status';
import config from './app/config/index.ts';
import { notFound } from './app/middlewares/notFound.ts';
import { AttendanceRoutes } from './app/modules/attendance/attendance.route.ts';
import { AuthRoutes } from './app/modules/auth/auth.route.ts';
import { CourseRoutes } from './app/modules/course/course.route.ts';
import { CoursePrerequisiteRoutes } from './app/modules/course-prerequisite/course-prerequisite.route.ts';
import { CourseRegistrationRoutes } from './app/modules/course-registration/course-registration.route.ts';
import { DepartmentRoutes } from './app/modules/department/department.route.ts';
import { ExamRoutes } from './app/modules/exam/exam.route.ts';
import { InstructorRoutes } from './app/modules/instructor/instructor.route.ts';
import { InstructorApplicationRoutes } from './app/modules/instructor-application/instructor-application.route.ts';
import { ProgramRoutes } from './app/modules/program/program.route.ts';
import { SectionRoutes } from './app/modules/section/section.route.ts';
import { SemesterRoutes } from './app/modules/semester/semester.route.ts';
import { StudentRoutes } from './app/modules/student/student.route.ts';
import { globalErrorHandler } from './app/utils/globalErrorHandler.ts';
import { ResultRoutes } from './app/modules/result/result.route.ts';

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
app.use('/api/v1/auth', AuthRoutes);

// ExamRoutes
app.use('/api/v1/exams', ExamRoutes);

// DepartmentRoutes
app.use('/api/v1/departments', DepartmentRoutes);

// ProgramRoutes
app.use('/api/v1/programs', ProgramRoutes);

// CourseRoutes
app.use('/api/v1/courses', CourseRoutes);

// SemesterRoutes
app.use('/api/v1/semesters', SemesterRoutes);

// CoursePrerequisiteRoutes
app.use('/api/v1/course-prerequisites', CoursePrerequisiteRoutes);

// SectionRoutes
app.use('/api/v1/sections', SectionRoutes);

// InstructorApplicationRoutes
app.use('/api/v1/instructor-applications', InstructorApplicationRoutes);

// InstructorsRoutes
app.use('/api/v1/instructors', InstructorRoutes);

// CourseRegistrationRoutes
app.use('/api/v1/course-registrations', CourseRegistrationRoutes);

// StudentRoutes
app.use('/api/v1/students', StudentRoutes);

// AttendanceRoutes
app.use('/api/v1/attendances', AttendanceRoutes);

// ResultRoutes
app.use('/api/v1/results', ResultRoutes);

// WelcomeRoute
app.get('/', (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Welcome to University Management System Server!',
    data: null,
  });
});

// GlobalErrorHandler
app.use(globalErrorHandler);

// NotFound
app.use(notFound);

export default app;
