export interface IApplyAsInstructorPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  bio?: string;
  departmentId?: string;
}

export interface IVerifyInstructorEmailPayload {
  email: string;
  otp: string;
}

export interface IReviewInstructorApplicationPayload {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface IInstructorApplicationQuery {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  searchTerm?: string;
}
