import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { UserRole } from '../../../generated/prisma/enums.ts';
import config from '../../config/index.ts';
import { prisma } from '../../../lib/prisma.ts';
import { redisClient } from '../../../lib/redis.ts';
import { transporter } from '../../../lib/nodemailer.ts';
import { AppError } from '../../utils/AppError.ts';
import type {
  ApplyAsInstructorInput,
  InstructorApplicationQueryInput,
  ReviewInstructorApplicationInput,
  VerifyInstructorEmailInput,
} from './instructor-application.validation.ts';

const OTP_EXPIRATION_SECONDS = 5 * 60;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ApplyAsInstructor
const applyAsInstructor = async (payload: ApplyAsInstructorInput) => {
  const {
    email,
    password,
    firstName,
    lastName,
    specialization,
    qualification,
    experienceYears,
    bio,
    departmentId,
  } = payload;

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      'An account already exists with this email address!',
    );
  }

  if (departmentId) {
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!department) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'The selected department was not found or is inactive!',
      );
    }
  }

  const existingApplication = await prisma.instructorApplication.findFirst({
    where: {
      email: normalizedEmail,
      deletedAt: null,
      status: 'PENDING',
    },
  });

  if (existingApplication) {
    throw new AppError(
      httpStatus.CONFLICT,
      'You already have a pending instructor application with this email!',
    );
  }

  const existingOtp = await redisClient.get(
    `instructor-application-otp:${normalizedEmail}`,
  );

  if (existingOtp) {
    throw new AppError(
      httpStatus.TOO_MANY_REQUESTS,
      'An OTP has already been sent. Please wait before requesting another OTP.',
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const application = await prisma.instructorApplication.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      firstName,
      lastName,
      specialization,
      qualification,
      experienceYears,
      ...(bio !== undefined && { bio }),
      ...(departmentId !== undefined && { departmentId }),
    },
  });

  const otp = generateOtp();

  await redisClient.set(`instructor-application-otp:${normalizedEmail}`, otp, {
    EX: OTP_EXPIRATION_SECONDS,
  });

  await redisClient.set(
    `instructor-application-otp-cooldown:${normalizedEmail}`,
    'true',
    {
      EX: OTP_RESEND_COOLDOWN_SECONDS,
    },
  );

  await transporter.sendMail({
    from: config.smtp_user,
    to: normalizedEmail,
    subject:
      'University Management System - Instructor Application Verification',
    html: `
			<h2>Verify Your Email</h2>
			<p>Hello ${firstName},</p>
			<p>Your instructor application has been received.</p>
			<p>Your verification OTP is:</p>
			<h1>${otp}</h1>
			<p>This OTP will expire in 5 minutes.</p>
			<p>If you did not submit this application, please ignore this email.</p>
		`,
  });

  return {
    id: application.id,
    email: application.email,
    status: application.status,
    emailVerified: false,
  };
};

// VerifyInstructorEmail
const verifyInstructorEmail = async (payload: VerifyInstructorEmailInput) => {
  const normalizedEmail = payload.email.toLowerCase().trim();

  const application = await prisma.instructorApplication.findFirst({
    where: {
      email: normalizedEmail,
      deletedAt: null,
      status: 'PENDING',
    },
  });

  if (!application) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Pending instructor application not found!',
    );
  }

  if (application.emailVerifiedAt) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This email address has already been verified!',
    );
  }

  const redisKey = `instructor-application-otp:${normalizedEmail}`;

  const storedOtp = await redisClient.get(redisKey);

  if (!storedOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'OTP has expired or does not exist. Please request a new OTP!',
    );
  }

  if (storedOtp !== payload.otp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP!');
  }

  await redisClient.del(redisKey);

  const updatedApplication = await prisma.instructorApplication.update({
    where: {
      id: application.id,
    },
    data: {
      emailVerifiedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
    },
  });

  return updatedApplication;
};

// GetAllInstructorApplications
const getAllInstructorApplications = async (
  query: InstructorApplicationQueryInput,
) => {
  const { page, limit, status, searchTerm } = query;

  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(searchTerm && {
      OR: [
        {
          firstName: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          lastName: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          email: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          specialization: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
      ],
    }),
  };

  const [applications, total] = await prisma.$transaction([
    prisma.instructorApplication.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        specialization: true,
        qualification: true,
        experienceYears: true,
        bio: true,
        departmentId: true,
        emailVerifiedAt: true,
        status: true,
        rejectionReason: true,
        reviewedBy: true,
        reviewedAt: true,
        userId: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.instructorApplication.count({
      where,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: applications,
  };
};

// ReviewInstructorApplication
const reviewInstructorApplication = async (
  applicationId: string,
  payload: ReviewInstructorApplicationInput,
  reviewedBy: string,
) => {
  const application = await prisma.instructorApplication.findFirst({
    where: {
      id: applicationId,
      deletedAt: null,
    },
  });

  if (!application) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Instructor application not found!',
    );
  }

  if (application.status !== 'PENDING') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This instructor application has already been reviewed!',
    );
  }

  if (!application.emailVerifiedAt) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'The applicant must verify their email before the application can be reviewed!',
    );
  }

  if (payload.status === 'REJECTED') {
    const rejectedApplication = await prisma.instructorApplication.update({
      where: {
        id: application.id,
      },
      data: {
        status: 'REJECTED',
        rejectionReason: payload.rejectionReason!,
        reviewedBy,
        reviewedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        specialization: true,
        qualification: true,
        experienceYears: true,
        bio: true,
        departmentId: true,
        emailVerifiedAt: true,
        status: true,
        rejectionReason: true,
        reviewedBy: true,
        reviewedAt: true,
        userId: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return rejectedApplication;
  }

  const result = await prisma.$transaction(async tx => {
    const existingUser = await tx.user.findUnique({
      where: {
        email: application.email,
      },
    });

    if (existingUser) {
      throw new AppError(
        httpStatus.CONFLICT,
        'An account already exists with this email address!',
      );
    }

    const user = await tx.user.create({
      data: {
        email: application.email,
        passwordHash: application.passwordHash,
        role: UserRole.INSTRUCTOR,
        firstName: application.firstName,
        lastName: application.lastName,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const instructorProfile = await tx.instructorProfile.create({
      data: {
        userId: user.id,
        instructorId: `INS-${Date.now()}`,
      },
      select: {
        id: true,
        userId: true,
        instructorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // UpdateApplication
    const updatedApplication = await tx.instructorApplication.update({
      where: {
        id: application.id,
      },
      data: {
        status: 'APPROVED',
        reviewedBy,
        reviewedAt: new Date(),
        userId: user.id,
        passwordHash: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        specialization: true,
        qualification: true,
        experienceYears: true,
        bio: true,
        departmentId: true,
        emailVerifiedAt: true,
        status: true,
        rejectionReason: true,
        reviewedBy: true,
        reviewedAt: true,
        userId: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      user,
      instructorProfile,
      application: updatedApplication,
    };
  });

  return result;
};

export const InstructorApplicationService = {
  applyAsInstructor,
  verifyInstructorEmail,
  getAllInstructorApplications,
  reviewInstructorApplication,
};
