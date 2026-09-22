export interface ICreateFeePayload {
  studentId: string;
  title: string;
  description?: string | undefined;
  amount: number;
  dueDate: Date;
}

export interface IUpdateFeePayload {
  title?: string | undefined;
  description?: string | undefined;
  amount?: number | undefined;
  dueDate?: Date | undefined;
  status?:
    | 'UNPAID'
    | 'PARTIALLY_PAID'
    | 'PAID'
    | 'OVERDUE'
    | 'CANCELLED'
    | undefined;
  isActive?: boolean | undefined;
}

export interface IFeeQuery {
  searchTerm?: string | undefined;
  studentId?: string | undefined;
  status?:
    | 'UNPAID'
    | 'PARTIALLY_PAID'
    | 'PAID'
    | 'OVERDUE'
    | 'CANCELLED'
    | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: 'title' | 'amount' | 'dueDate' | 'createdAt' | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}
