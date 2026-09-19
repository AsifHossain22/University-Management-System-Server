import { z } from "zod";

const semesterBaseSchema = z.object({
	name: z.string().trim().min(1, "Semester name is required"),
	code: z.string().trim().min(1, "Semester code is required"),
	startDate: z.coerce.date("Start date must be a valid date"),
	endDate: z.coerce.date("End date must be a valid date"),
	isActive: z.boolean().optional(),
});

const validateSemesterDates = <T extends { startDate: Date; endDate: Date }>(
	data: T,
	ctx: z.RefinementCtx,
) => {
	if (data.startDate >= data.endDate) {
		ctx.addIssue({
			code: "custom",
			message: "Start date must be earlier than end date",
			path: ["endDate"],
		});
	}
};

export const createSemesterSchema = semesterBaseSchema
	.omit({ isActive: true })
	.superRefine(validateSemesterDates);

export const updateSemesterSchema = semesterBaseSchema
	.partial()
	.superRefine((data, ctx) => {
		if (Object.keys(data).length === 0) {
			ctx.addIssue({
				code: "custom",
				message: "At least one field is required to update the semester!",
			});
			return;
		}

		if (data.startDate !== undefined && data.endDate !== undefined) {
			validateSemesterDates(data as { startDate: Date; endDate: Date }, ctx);
		}
	});

export const semesterQuerySchema = z.object({
	searchTerm: z.string().trim().optional(),
	isActive: z
		.enum(["true", "false"])
		.transform((value) => value === "true")
		.optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
	sortBy: z
		.enum(["name", "code", "startDate", "endDate", "createdAt"])
		.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateSemesterInput = z.infer<typeof createSemesterSchema>;
export type UpdateSemesterInput = z.infer<typeof updateSemesterSchema>;
export type SemesterQueryInput = z.infer<typeof semesterQuerySchema>;
