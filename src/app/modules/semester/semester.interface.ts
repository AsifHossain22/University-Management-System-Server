export interface ICreateSemester {
	name: string;
	code: string;
	startDate: string;
	endDate: string;
}

export interface IUpdateSemester {
	name?: string;
	code?: string;
	startDate?: string;
	endDate?: string;
	isActive?: boolean;
}

export interface ISemesterFilterRequest {
	searchTerm?: string;
	isActive?: boolean;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}
