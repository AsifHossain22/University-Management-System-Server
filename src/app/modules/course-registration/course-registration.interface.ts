export interface ICreateCourseRegistrationPayload {
  sectionId: string;
}

export interface ICourseRegistrationQuery {
  page?: number;
  limit?: number;
  status?: 'REGISTERED' | 'DROPPED' | 'COMPLETED' | 'CANCELLED';
  searchTerm?: string;
}
