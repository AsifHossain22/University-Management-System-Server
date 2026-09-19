export interface ICreateCourse {
	name: string;
	code: string;
	description?: string;
	credits: number;
	departmentId: string;
	programId: string;
}

export interface IUpdateCourse {
	name?: string;
	code?: string;
	description?: string;
	credits?: number;
	departmentId?: string;
	programId?: string;
	isActive?: boolean;
}

export interface ICourseFilterRequest {
	searchTerm?: string;
	departmentId?: string;
	programId?: string;
	isActive?: boolean;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}
