// RegisterUser
export interface IRegisterUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'STUDENT' | 'INSTRUCTOR';
}

// LogInUser
export interface ILoginUser {
  email: string;
  password: string;
}

// RefreshToken
export interface IRefreshTokenPayload {
  refreshToken: string;
}

// GoogleLogin
export interface IGoogleLoginPayload {
  idToken: string;
}

// VerifyEmail
export interface IVerifyEmailPayload {
  email: string;
  otp: string;
}

// ForgotPassword
export interface IForgotPasswordPayload {
  email: string;
}

// ResetPassword
export interface IResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}
