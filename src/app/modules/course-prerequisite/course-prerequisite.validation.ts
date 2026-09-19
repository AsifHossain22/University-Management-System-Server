import { z } from "zod";

const coursePrerequisiteBaseSchema = z.object({
	courseId: z.uuid("Course ID must be a valid UUID"),
	prerequisiteId: z.uuid("Prerequisite course ID must be a valid UUID"),
});

export const createCoursePrerequisiteSchema =
	coursePrerequisiteBaseSchema.refine(
		(data) => data.courseId !== data.prerequisiteId,
		{
			message: "A course cannot be its own prerequisite!",
			path: ["prerequisiteId"],
		},
	);

export const coursePrerequisiteQuerySchema = z.object({
	courseId: z.uuid("Course ID must be a valid UUID").optional(),
	prerequisiteId: z
		.uuid("Prerequisite course ID must be a valid UUID")
		.optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateCoursePrerequisiteInput = z.infer<
	typeof createCoursePrerequisiteSchema
>;

export type CoursePrerequisiteQueryInput = z.infer<
	typeof coursePrerequisiteQuerySchema
>;
