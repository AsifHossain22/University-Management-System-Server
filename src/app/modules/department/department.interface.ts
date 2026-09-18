export interface ICreateDepartment {
	name: string;
	code: string;
	description?: string;
}

export interface IUpdateDepartment {
	name?: string;
	code?: string;
	description?: string;
	isActive?: boolean;
}

export interface IDepartmentFilterRequest {
	searchTerm?: string;
	isActive?: boolean;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}
