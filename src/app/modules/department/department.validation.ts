import { z } from "zod";

const departmentBaseSchema = z.object({
	name: z.string().trim().min(1, "Department name is required"),
	code: z.string().trim().min(1, "Department code is required"),
	description: z.string().trim().optional(),
	isActive: z.boolean().optional(),
});

export const createDepartmentSchema = departmentBaseSchema.omit({
	isActive: true,
});

export const updateDepartmentSchema = departmentBaseSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required to update the department!",
	});

export const departmentQuerySchema = z.object({
	searchTerm: z.string().trim().optional(),
	isActive: z
		.enum(["true", "false"])
		.transform((value) => value === "true")
		.optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
	sortBy: z.enum(["name", "code", "createdAt"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export type DepartmentQueryInput = z.infer<typeof departmentQuerySchema>;
