export interface ICreateSection {
  name: string;
  code: string;
  courseId: string;
  semesterId: string;
  instructorId: string;
  capacity: number;
}

export interface IUpdateSection {
  name?: string;
  code?: string;
  courseId?: string;
  semesterId?: string;
  instructorId?: string;
  capacity?: number;
  isActive?: boolean;
}

export interface ISectionFilterRequest {
  searchTerm?: string;
  courseId?: string;
  semesterId?: string;
  instructorId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
