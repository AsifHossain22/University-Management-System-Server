import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma.ts";
import type {
	CreateExamInput,
	ExamQueryInput,
	UpdateExamInput,
} from "./exam.validation.ts";

// CreateExam
const createExam = async (payload: CreateExamInput) => {
	const section = await prisma.section.findFirst({
		where: {
			id: payload.sectionId,
			isActive: true,
			deletedAt: null,
		},
	});

	if (!section) {
		throw {
			statusCode: httpStatus.NOT_FOUND,
			message: "Section not found or inactive!",
		};
	}

	if (payload.passingMarks > payload.totalMarks) {
		throw {
			statusCode: httpStatus.BAD_REQUEST,
			message: "Passing marks cannot exceed total marks!",
		};
	}

	const exam = await prisma.exam.create({
		data: {
			sectionId: payload.sectionId,
			title: payload.title,
			type: payload.type,
			examDate: payload.examDate,
			totalMarks: payload.totalMarks,
			passingMarks: payload.passingMarks,
			weight: payload.weight,
		},
	});

	return exam;
};

// GetExams
const getExams = async (query: ExamQueryInput) => {
	const {
		searchTerm,
		sectionId,
		type,
		isActive,
		page = 1,
		limit = 10,
		sortBy = "examDate",
		sortOrder = "asc",
	} = query;

	const skip = (page - 1) * limit;

	const where = {
		deletedAt: null,
		...(searchTerm
			? {
					title: {
						contains: searchTerm,
						mode: "insensitive" as const,
					},
				}
			: {}),
		...(sectionId ? { sectionId } : {}),
		...(type ? { type } : {}),
		...(isActive !== undefined ? { isActive } : {}),
	};

	const [exams, total] = await prisma.$transaction([
		prisma.exam.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortOrder,
			},
			include: {
				section: {
					select: {
						id: true,
						name: true,
						code: true,
					},
				},
			},
		}),
		prisma.exam.count({
			where,
		}),
	]);

	const totalPages = Math.ceil(total / limit);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages,
		},
		data: exams,
	};
};

// GetExamById
const getExamById = async (examId: string) => {
	const exam = await prisma.exam.findFirst({
		where: {
			id: examId,
			deletedAt: null,
		},
		include: {
			section: {
				select: {
					id: true,
					name: true,
					code: true,
					courseId: true,
					semesterId: true,
					instructorId: true,
				},
			},
		},
	});

	if (!exam) {
		throw {
			statusCode: httpStatus.NOT_FOUND,
			message: "Exam not found!",
		};
	}

	return exam;
};

// UpdateExam
const updateExam = async (examId: string, payload: UpdateExamInput) => {
	const existingExam = await prisma.exam.findFirst({
		where: {
			id: examId,
			deletedAt: null,
		},
	});

	if (!existingExam) {
		throw {
			statusCode: httpStatus.NOT_FOUND,
			message: "Exam not found!",
		};
	}

	const totalMarks = payload.totalMarks ?? existingExam.totalMarks;
	const passingMarks = payload.passingMarks ?? existingExam.passingMarks;

	if (passingMarks > totalMarks) {
		throw {
			statusCode: httpStatus.BAD_REQUEST,
			message: "Passing marks cannot exceed total marks",
		};
	}

	const exam = await prisma.exam.update({
		where: {
			id: examId,
		},
		data: {
			...(payload.title !== undefined && {
				title: payload.title,
			}),
			...(payload.type !== undefined && {
				type: payload.type,
			}),
			...(payload.examDate !== undefined && {
				examDate: payload.examDate,
			}),
			...(payload.totalMarks !== undefined && {
				totalMarks: payload.totalMarks,
			}),
			...(payload.passingMarks !== undefined && {
				passingMarks: payload.passingMarks,
			}),
			...(payload.weight !== undefined && {
				weight: payload.weight,
			}),
			...(payload.isActive !== undefined && {
				isActive: payload.isActive,
			}),
		},
	});

	return exam;
};

// SoftDeleteExam
const softDeleteExam = async (examId: string) => {
	const existingExam = await prisma.exam.findFirst({
		where: {
			id: examId,
			deletedAt: null,
		},
	});

	if (!existingExam) {
		throw {
			statusCode: httpStatus.NOT_FOUND,
			message: "Exam not found!",
		};
	}

	const exam = await prisma.exam.update({
		where: {
			id: examId,
		},
		data: {
			deletedAt: new Date(),
			isActive: false,
		},
	});

	return exam;
};

export const ExamService = {
	createExam,
	getExams,
	getExamById,
	updateExam,
	softDeleteExam,
};
