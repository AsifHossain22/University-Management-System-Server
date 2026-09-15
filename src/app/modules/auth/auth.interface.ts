export interface IRegisterUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'STUDENT' | 'INSTRUCTOR';
}

export interface ILoginUser {
  email: string;
  password: string;
}
