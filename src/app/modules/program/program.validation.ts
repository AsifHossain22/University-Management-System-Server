import { z } from "zod";

const programBaseSchema = z.object({
	name: z.string().trim().min(1, "Program name is required"),
	code: z.string().trim().min(1, "Program code is required"),
	description: z.string().trim().optional(),
	departmentId: z.string().trim().min(1, "Department ID is required"),
	isActive: z.boolean().optional(),
});

export const createProgramSchema = programBaseSchema.omit({
	isActive: true,
});

export const updateProgramSchema = programBaseSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required to update the program!",
	});

export const programQuerySchema = z.object({
	searchTerm: z.string().trim().optional(),

	departmentId: z.string().trim().optional(),

	isActive: z
		.enum(["true", "false"])
		.transform((value) => value === "true")
		.optional(),

	page: z.coerce.number().int().positive().default(1),

	limit: z.coerce.number().int().positive().max(100).default(10),

	sortBy: z.enum(["name", "code", "createdAt"]).default("createdAt"),

	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;

export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;

export type ProgramQueryInput = z.infer<typeof programQuerySchema>;
