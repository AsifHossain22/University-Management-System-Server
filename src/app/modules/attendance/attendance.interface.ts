export interface ICreateAttendancePayload {
  registrationId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export interface IUpdateAttendancePayload {
  status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export interface IAttendanceQuery {
  page?: number;
  limit?: number;
  status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  date?: string;
  searchTerm?: string;
}
