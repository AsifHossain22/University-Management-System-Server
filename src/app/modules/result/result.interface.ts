export interface ICreateResult {
	registrationId: string;
	examId: string;
	obtainedMarks: number;
	remarks?: string | undefined;
}

export interface IUpdateResult {
	obtainedMarks?: number | undefined;
	remarks?: string | undefined;
}

export interface IResultFilterRequest {
	searchTerm?: string | undefined;
	registrationId?: string | undefined;
	examId?: string | undefined;
	studentId?: string | undefined;
	sectionId?: string | undefined;
	page?: number | undefined;
	limit?: number | undefined;
	sortBy?: string | undefined;
	sortOrder?: "asc" | "desc" | undefined;
}
