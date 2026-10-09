import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import httpStatus from 'http-status';
import { UserRole } from '../../../generated/prisma/enums.ts';
import config from '../../config/index.ts';
import { cloudinary } from '../../../lib/cloudinary.ts';
import { prisma } from '../../../lib/prisma.ts';
import { redisClient } from '../../../lib/redis.ts';
import { transporter } from '../../../lib/nodemailer.ts';
import { AppError } from '../../utils/AppError.ts';
import { AuditLogService } from '../audit-log/audit-log.service.ts';
import type {
  ApplyAsInstructorInput,
  InstructorApplicationQueryInput,
  ReviewInstructorApplicationInput,
  VerifyInstructorEmailInput,
} from './instructor-application.validation.ts';

const OTP_EXPIRATION_SECONDS = 5 * 60; // 5 min
const OTP_RESEND_COOLDOWN_SECONDS = 60; // 60 sec

const generateOtp = (): string => crypto.randomInt(100000, 1000000).toString();

export type InstructorApplicationFiles = {
  profilePhoto?: Express.Multer.File;
  cv?: Express.Multer.File;
  supportingDocuments: Express.Multer.File[];
};

type UploadedFileMetadata = {
  url: string;
  publicId: string;
  originalName: string;
  mimeType: string;
  size: number;
};

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

type DecisionEmailApplication = {
  email: string;
  firstName: string;
  lastName: string;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
};

// EscapeUserProvidedContentBeforeInsertingIntoHTML
const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character]!;
  });

// SendApprovalOrRejectionEmail
const sendInstructorApplicationDecisionEmail = async (
  application: DecisionEmailApplication,
): Promise<void> => {
  const name = escapeHtml(`${application.firstName} ${application.lastName}`);

  const isApproved = application.status === 'APPROVED';

  const subject = isApproved
    ? 'University Management System - Instructor Application Approved'
    : 'University Management System - Instructor Application Update';

  const message = isApproved
    ? `
        <p>Congratulations, ${name}!</p>
        <p>Your instructor application has been approved.</p>
        <p>You can now sign in using your registered email address and the password you provided during your application.</p>
        <p>Welcome to our University Management System!</p>
      `
    : `
        <p>Hello ${name},</p>
        <p>Thank you for applying to become an instructor.</p>
        <p>Unfortunately, your instructor application has been rejected.</p>
        <p><strong>Reason:</strong> ${escapeHtml(
          application.rejectionReason ?? 'No reason was provided.',
        )}</p>
        <p>You may submit a new application using the same email address. You will need to verify your email again using a new OTP.</p>
      `;

  await transporter.sendMail({
    from: config.smtp_user,
    to: application.email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2>Instructor Application Update</h2>
        ${message}
        <p>Regards,<br />University Management System</p>
      </div>
    `,
  });
};

// UploadApplicationFileToCloudinary
const uploadApplicationFile = async (
  file: Express.Multer.File,
  resourceType: 'image' | 'raw',
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const safeOriginalName = file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);

    const publicId = `${safeOriginalName}-${crypto.randomUUID()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'university-management/instructor-applications',
        resource_type: resourceType,
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url || !result.public_id) {
          reject(new Error('Cloudinary did not return file information.'));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    uploadStream.end(file.buffer);
  });
};

// DeleteUploadedCloudinaryFileDuringCleanup
const deleteCloudinaryFile = async (
  publicId: string,
  resourceType: 'image' | 'raw',
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Failed to clean up an uploaded application file:', error);
  }
};

// UploadFileAndReturnMetadata
const uploadApplicationFileWithMetadata = async (
  file: Express.Multer.File,
  resourceType: 'image' | 'raw',
): Promise<UploadedFileMetadata> => {
  const result = await uploadApplicationFile(file, resourceType);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
};

// ApplyAsInstructor
const applyAsInstructor = async (
  payload: ApplyAsInstructorInput,
  files: InstructorApplicationFiles,
) => {
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

  const normalizedEmail = email.trim().toLowerCase();

  // ValidateDuplicateInstructorApplication
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      'An account already exists with this email address!',
    );
  }

  // ValidateSelectedDepartment
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

  // OnlyActivePendingApplicationBlocksNewApplication
  const existingApplication = await prisma.instructorApplication.findFirst({
    where: {
      email: normalizedEmail,
      deletedAt: null,
      status: 'PENDING',
    },
  });

  if (existingApplication?.emailVerifiedAt) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Your email is already verified and your instructor application is awaiting administrator approval.',
    );
  }

  const otpKey = `instructor-application-otp:${normalizedEmail}`;
  const cooldownKey = `instructor-application-otp-cooldown:${normalizedEmail}`;

  const existingOtp = await redisClient.get(otpKey);

  if (existingOtp && !existingApplication) {
    throw new AppError(
      httpStatus.TOO_MANY_REQUESTS,
      'An OTP has already been sent. Please wait before requesting another OTP.',
    );
  }

  // ReplaceUnverifiedPendingApplicationButPreserveRejectedHistory
  if (existingApplication) {
    await redisClient.del([otpKey, cooldownKey]);

    await prisma.instructorApplication.update({
      where: { id: existingApplication.id },
      data: { deletedAt: new Date() },
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const uploadedAssets: Array<{
    publicId: string;
    resourceType: 'image' | 'raw';
  }> = [];

  let createdApplicationId: string | undefined;

  try {
    // UploadProfilePhoto
    const profilePhoto = files.profilePhoto
      ? await uploadApplicationFileWithMetadata(files.profilePhoto, 'image')
      : undefined;

    if (profilePhoto) {
      uploadedAssets.push({
        publicId: profilePhoto.publicId,
        resourceType: 'image',
      });
    }

    // UploadCV
    const cv = files.cv
      ? await uploadApplicationFileWithMetadata(files.cv, 'raw')
      : undefined;

    if (cv) {
      uploadedAssets.push({
        publicId: cv.publicId,
        resourceType: 'raw',
      });
    }

    // UploadSupportingDocuments
    const supportingDocuments: UploadedFileMetadata[] = [];

    for (const file of files.supportingDocuments) {
      const document = await uploadApplicationFileWithMetadata(file, 'raw');

      uploadedAssets.push({
        publicId: document.publicId,
        resourceType: 'raw',
      });

      supportingDocuments.push(document);
    }

    // CreateNewApplicationRecord - RejectedApplicationsRemainUntouched
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
        ...(profilePhoto && {
          profilePhotoUrl: profilePhoto.url,
          profilePhotoPublicId: profilePhoto.publicId,
        }),
        ...(cv && {
          cvUrl: cv.url,
          cvPublicId: cv.publicId,
        }),
        supportingDocuments: supportingDocuments.map(document => ({
          url: document.url,
          publicId: document.publicId,
          originalName: document.originalName,
          mimeType: document.mimeType,
          size: document.size,
        })),
      },
    });

    createdApplicationId = application.id;

    // EveryNewApplicationRequiresOwnEmailVerification
    const otp = generateOtp();

    await redisClient.set(otpKey, otp, {
      EX: OTP_EXPIRATION_SECONDS,
    });

    await redisClient.set(cooldownKey, 'true', {
      EX: OTP_RESEND_COOLDOWN_SECONDS,
    });

    // SendNewVerificationOTP
    await transporter.sendMail({
      from: config.smtp_user,
      to: normalizedEmail,
      subject:
        'University Management System - Instructor Application Verification',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h2>Verify Your Email</h2>
          <p>Hello ${escapeHtml(firstName)},</p>
          <p>Your instructor application has been received.</p>
          <p>Please use the following OTP to verify your email address:</p>
          <h1>${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you did not submit this application, please ignore this email.</p>
        </div>
      `,
    });

    return {
      id: application.id,
      email: application.email,
      status: application.status,
      emailVerified: false,
    };
  } catch (error) {
    // RemoveOTPAndCooldownIfSubmissionFails
    await redisClient.del([otpKey, cooldownKey]).catch(() => undefined);

    // SoftDeleteNewlyCreatedApplicationIfSubmissionFailed
    if (createdApplicationId) {
      await prisma.instructorApplication
        .update({
          where: { id: createdApplicationId },
          data: { deletedAt: new Date() },
        })
        .catch(cleanupError => {
          console.error(
            'Failed to clean up instructor application:',
            cleanupError,
          );
        });
    }

    // CleanUpFilesUploadedDuringThisAttempt
    await Promise.all(
      uploadedAssets.map(asset =>
        deleteCloudinaryFile(asset.publicId, asset.resourceType),
      ),
    );

    console.error('Instructor application submission failed:', error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.BAD_GATEWAY,
      'Instructor application submission failed. Please try again.',
    );
  }
};

// VerifyInstructorEmailUsingOTP
const verifyInstructorEmail = async (payload: VerifyInstructorEmailInput) => {
  const normalizedEmail = payload.email.trim().toLowerCase();

  const application = await prisma.instructorApplication.findFirst({
    where: {
      email: normalizedEmail,
      deletedAt: null,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
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

  const updatedApplication = await prisma.instructorApplication.update({
    where: { id: application.id },
    data: { emailVerifiedAt: new Date() },
    select: {
      id: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
    },
  });

  await redisClient.del(redisKey);

  return updatedApplication;
};

// RetrieveInstructorApplicationsForAdminDashboard
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
      orderBy: { createdAt: 'desc' },
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
        profilePhotoUrl: true,
        cvUrl: true,
        supportingDocuments: true,
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
    prisma.instructorApplication.count({ where }),
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

// ApproveOrRejectPendingInstructorApplication
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

  // RejectApplication
  if (payload.status === 'REJECTED') {
    const updatedApplication = await prisma.$transaction(async tx => {
      const updated = await tx.instructorApplication.update({
        where: { id: application.id },
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
          profilePhotoUrl: true,
          cvUrl: true,
          supportingDocuments: true,
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

      await AuditLogService.createAuditLog(
        {
          userId: reviewedBy,
          action: 'REJECT',
          entity: 'INSTRUCTOR_APPLICATION',
          entityId: application.id,
          description: 'Instructor application rejected by Admin.',
          metadata: {
            rejectionReason: payload.rejectionReason,
            email: application.email,
          },
        },
        tx,
      );

      return updated;
    });

    try {
      await sendInstructorApplicationDecisionEmail({
        email: updatedApplication.email,
        firstName: updatedApplication.firstName,
        lastName: updatedApplication.lastName,
        status: 'REJECTED',
        rejectionReason: updatedApplication.rejectionReason,
      });
    } catch (error) {
      console.error('Instructor rejection email could not be sent:', error);
    }

    return updatedApplication;
  }

  // ApproveApplication
  const result = await prisma.$transaction(async tx => {
    const existingUser = await tx.user.findUnique({
      where: { email: application.email },
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
        instructorEmail: user.email,
      },
    });

    const updatedApplication = await tx.instructorApplication.update({
      where: { id: application.id },
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
        profilePhotoUrl: true,
        cvUrl: true,
        supportingDocuments: true,
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

    await AuditLogService.createAuditLog(
      {
        userId: reviewedBy,
        action: 'APPROVE',
        entity: 'INSTRUCTOR_APPLICATION',
        entityId: application.id,
        description: 'Instructor application approved by Admin.',
        metadata: {
          email: application.email,
          createdUserId: user.id,
          instructorProfileId: instructorProfile.id,
        },
      },
      tx,
    );

    return {
      user,
      instructorProfile,
      application: updatedApplication,
    };
  });

  try {
    await sendInstructorApplicationDecisionEmail({
      email: result.application.email,
      firstName: result.application.firstName,
      lastName: result.application.lastName,
      status: 'APPROVED',
    });
  } catch (error) {
    console.error('Instructor approval email could not be sent:', error);
  }

  return result;
};

export const InstructorApplicationService = {
  applyAsInstructor,
  verifyInstructorEmail,
  getAllInstructorApplications,
  reviewInstructorApplication,
};
