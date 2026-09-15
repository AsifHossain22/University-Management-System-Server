import bcrypt from 'bcryptjs';

import config from '../../config/index.ts';
import { prisma } from '../../../lib/prisma.ts';
import { jwtUtils } from '../../utils/jwt.ts';

import type { ILoginUser, IRegisterUser } from './auth.interface.ts';

// RegisterUser
const registerUser = async (payload: IRegisterUser) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  // CheckIfUserAlreadyExists
  if (existingUser) {
    throw new Error('User already exists with this email!');
  }

  // HashPassword
  const passwordHash = await bcrypt.hash(payload.password, 12);

  // CreateUser
  const user = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
    },
    omit: {
      passwordHash: true,
    },
  });

  return user;
};

// LogInUser
const loginUser = async (payload: ILoginUser) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new Error('Invalid email or password!');
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.passwordHash ?? '',
  );

  if (!isPasswordMatched) {
    throw new Error('Invalid email or password!');
  }

  const accessToken = jwtUtils.createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  return {
    accessToken,
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
  loginUser,
};
