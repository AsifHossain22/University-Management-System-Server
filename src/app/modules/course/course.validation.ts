import { z } from "zod";

const courseBaseSchema = z.object({
	name: z.string().trim().min(1, "Course name is required"),

	code: z.string().trim().min(1, "Course code is required"),

	description: z.string().trim().optional(),

	credits: z
		.number()
		.int("Course credits must be a whole number")
		.positive("Course credits must be greater than 0"),

	departmentId: z.string().trim().min(1, "Department ID is required"),

	programId: z.string().trim().min(1, "Program ID is required"),

	isActive: z.boolean().optional(),
});

export const createCourseSchema = courseBaseSchema.omit({
	isActive: true,
});

export const updateCourseSchema = courseBaseSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required to update the course!",
	});

export const courseQuerySchema = z.object({
	searchTerm: z.string().trim().optional(),

	departmentId: z.string().trim().optional(),

	programId: z.string().trim().optional(),

	isActive: z
		.enum(["true", "false"])
		.transform((value) => value === "true")
		.optional(),

	page: z.coerce.number().int().positive().default(1),

	limit: z.coerce.number().int().positive().max(100).default(10),

	sortBy: z.enum(["name", "code", "credits", "createdAt"]).default("createdAt"),

	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
