import type { ExamType } from "../../../generated/prisma/client.ts";

// CreateExam
export interface ICreateExam {
	sectionId: string;
	title: string;
	type: ExamType;
	examDate: Date;
	totalMarks: number;
	passingMarks: number;
	weight: number;
}

// UpdateExam
export interface IUpdateExam {
	title?: string;
	type?: ExamType;
	examDate?: Date;
	totalMarks?: number;
	passingMarks?: number;
	weight?: number;
	isActive?: boolean;
}

// FilterExam
export interface IExamFilterRequest {
	searchTerm?: string;
	sectionId?: string;
	type?: ExamType;
	isActive?: boolean;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}
