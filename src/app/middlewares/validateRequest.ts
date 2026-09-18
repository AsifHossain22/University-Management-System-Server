import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type z from "zod";
import { AppError } from "../utils/AppError.ts";
import { catchAsync } from "../utils/catchAsync.ts";

type RequestSource = "body" | "query" | "params";

export const validateRequest = (
	zodSchema: z.ZodObject,
	source: RequestSource = "body",
) => {
	return catchAsync((req: Request, res: Response, next: NextFunction) => {
		const payload = req[source];

		const result = zodSchema.safeParse(payload);

		if (!result.success) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				result.error.issues[0]?.message ?? "Validation failed.",
			);
		}

		if (source === "body") {
			req.body = result.data;
		} else {
			res.locals[source] = result.data;
		}

		next();
	});
};
