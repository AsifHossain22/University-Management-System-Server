export interface ICreateCoursePrerequisite {
	courseId: string;
	prerequisiteId: string;
}

export interface ICoursePrerequisiteFilterRequest {
	courseId?: string;
	prerequisiteId?: string;
	page?: number;
	limit?: number;
	sortOrder?: "asc" | "desc";
}
