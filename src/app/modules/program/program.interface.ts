export interface ICreateProgram {
	name: string;
	code: string;
	description?: string;
	departmentId: string;
}

export interface IUpdateProgram {
	name?: string;
	code?: string;
	description?: string;
	departmentId?: string;
	isActive?: boolean;
}

export interface IProgramFilterRequest {
	searchTerm?: string;
	departmentId?: string;
	isActive?: boolean;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}
