import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import ejs from 'ejs';
import httpStatus from 'http-status';
import path from 'path';
import { prisma } from '../../../lib/prisma.ts';
import { redisClient } from '../../../lib/redis.ts';
import { transporter } from '../../../lib/nodemailer.ts';
import { AppError } from '../../utils/AppError.ts';
import { jwtUtils } from '../../utils/jwt.ts';
import { googleUtils } from '../../utils/google.ts';
import type {
  IRegisterUser,
  IGoogleLoginPayload,
  IRefreshTokenPayload,
  ILoginUser,
  IVerifyEmailPayload,
} from './auth.interface.ts';
import config from '../../config/index.ts';

// RegisterUser
const registerUser = async (payload: IRegisterUser) => {
  const email = payload.email.trim().toLowerCase();

  // CheckIfUserAlreadyExists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      'User already exists with this email!',
    );
  }

  // HashPassword
  const passwordHash = await bcrypt.hash(payload.password, 12);

  // GenerateOTP
  const otp = crypto.randomInt(100000, 1000000).toString();

  // RedisKeys
  const otpKey = `student-registration-otp:${email}`;

  // RegistrationDataKey
  const registrationDataKey = `student-registration-data:${email}`;

  // TemporaryRegistrationData
  const registrationData = {
    email,
    passwordHash,
    firstName: payload.firstName,
    lastName: payload.lastName,
    role: payload.role,
  };

  // StoreOTPInRedis
  await redisClient.set(otpKey, otp, {
    EX: 300, // 5 min
  });

  // StoreRegistrationDataInRedis
  await redisClient.set(registrationDataKey, JSON.stringify(registrationData), {
    EX: 300, // 5 min
  });

  // RenderVerificationEmail
  const templatePath = path.join(
    process.cwd(),
    'src',
    'app',
    'templates',
    'registration-user-otp.ejs',
  );

  const emailHtml = await ejs.renderFile(templatePath, {
    name: `${payload.firstName} ${payload.lastName}`,
    otp,
  });

  // SendVerificationEmail
  await transporter.sendMail({
    from: config.smtp_user,
    to: email,
    subject: 'University Management System - Verify Your Email',
    html: emailHtml,
  });

  return {
    email,
    message: 'A verification OTP has been sent to your email address.',
  };
};

// VerifyEmail
const verifyEmail = async (payload: IVerifyEmailPayload) => {
  // NormalizeEmail
  const email = payload.email.trim().toLowerCase();

  // RedisKeys
  const otpKey = `student-registration-otp:${email}`;

  const registrationDataKey = `student-registration-data:${email}`;

  // GetOTPFromRedis
  const storedOtp = await redisClient.get(otpKey);

  if (!storedOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'OTP is invalid or has expired.',
    );
  }

  // VerifyOTP
  if (storedOtp !== payload.otp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Invalid OTP. Please provide the correct OTP.',
    );
  }

  // GetRegistrationDataFromRedis
  const registrationDataString = await redisClient.get(registrationDataKey);

  if (!registrationDataString) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Registration session has expired. Please register again.',
    );
  }

  // ParseRegistrationData
  let registrationData: IRegisterUser & {
    passwordHash: string;
  };

  try {
    registrationData = JSON.parse(registrationDataString);
  } catch {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Unable to process registration data.',
    );
  }

  // CheckExistingUser
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      'User already exists with this email!',
    );
  }

  // GenerateStudentId
  const studentId = `STU-${Date.now()}-${crypto
    .randomInt(1000, 10000)
    .toString()}`;

  // CreateUserAndStudentProfile
  const user = await prisma.$transaction(async transaction => {
    const createdUser = await transaction.user.create({
      data: {
        email: registrationData.email,
        passwordHash: registrationData.passwordHash,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        role: registrationData.role,
      },
    });

    await transaction.studentProfile.create({
      data: {
        userId: createdUser.id,
        studentId,
      },
    });

    return createdUser;
  });

  // DeleteRegistrationDataFromRedis
  await redisClient.del(otpKey);
  await redisClient.del(registrationDataKey);

  // TokenPayload
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  // CreateAccessToken
  const accessToken = jwtUtils.createAccessToken(tokenPayload);

  // CreateRefreshToken
  const refreshToken = jwtUtils.createRefreshToken(tokenPayload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
    },
    studentProfile: {
      studentId,
    },
  };
};

// LogInUser
const loginUser = async (payload: ILoginUser) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  // ValidateUserExistence
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password!');
  }

  if (!user.isActive || user.deletedAt) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account is inactive. Please contact the Admin.',
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.passwordHash ?? '',
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password!');
  }

  // TokenPayload
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  // CreateAccessToken
  const accessToken = jwtUtils.createAccessToken(tokenPayload);

  // CreateRefreshToken
  const refreshToken = jwtUtils.createRefreshToken(tokenPayload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
    },
  };
};

// RefreshToken
const refreshToken = async (payload: IRefreshTokenPayload) => {
  const verifiedToken = jwtUtils.verifyRefreshToken(payload.refreshToken);

  if (!verifiedToken.success) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Invalid or expired refresh token.',
    );
  }

  const tokenPayload = verifiedToken.data;

  if (
    typeof tokenPayload !== 'object' ||
    tokenPayload === null ||
    !('userId' in tokenPayload) ||
    !('email' in tokenPayload) ||
    !('role' in tokenPayload)
  ) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Invalid refresh token payload.',
    );
  }

  const userId = tokenPayload.userId;
  const email = tokenPayload.email;
  const role = tokenPayload.role;

  if (
    typeof userId !== 'string' ||
    typeof email !== 'string' ||
    typeof role !== 'string'
  ) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Invalid refresh token payload.',
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      email,
    },
  });

  if (!user) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'User not found. Please log in again.',
    );
  }

  if (!user.isActive || user.deletedAt) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account is inactive. Please contact the Admin.',
    );
  }

  if (user.role !== role) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account role is no longer valid.',
    );
  }

  // CreateNewAccessToken
  const newAccessToken = jwtUtils.createAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    accessToken: newAccessToken,
  };
};

// GetMe
const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    omit: {
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (!user.isActive || user.deletedAt) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account is inactive. Please contact the Admin.',
    );
  }

  return user;
};

// GoogleLogin
const googleLogin = async (payload: IGoogleLoginPayload) => {
  // VerifyGoogleIdToken
  const googlePayload = await googleUtils.verifyGoogleIdToken(payload.idToken);

  // ValidateGoogleEmail
  if (!googlePayload.email) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Google account email was not found!',
    );
  }

  // VerifyGoogleEmail
  if (googlePayload.email_verified !== true) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Google account email is not verified!',
    );
  }

  const email = googlePayload.email;

  // FindExistingUser
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // ValidateExistingUser
  if (existingUser) {
    if (!existingUser.isActive || existingUser.deletedAt) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Your account is inactive. Please contact the Admin.',
      );
    }
  }

  let user = existingUser;

  // CreateGoogleUser
  if (!user) {
    const firstName = googlePayload.given_name ?? 'Google';
    const lastName = googlePayload.family_name ?? 'User';

    user = await prisma.user.create({
      data: {
        email,
        passwordHash: null,
        firstName,
        lastName,
        role: 'STUDENT',
      },
    });
  }

  // TokenPayload
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  // CreateAccessToken
  const accessToken = jwtUtils.createAccessToken(tokenPayload);

  // CreateRefreshToken
  const refreshToken = jwtUtils.createRefreshToken(tokenPayload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
    },
  };
};

export const AuthService = {
  registerUser,
  verifyEmail,
  loginUser,
  refreshToken,
  getMe,
  googleLogin,
};
