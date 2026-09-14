import bcrypt from 'bcryptjs';

import { prisma } from '../../../lib/prisma.ts';

import type { IRegisterUser } from './auth.interface.ts';

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

export const AuthService = {
  registerUser,
};
