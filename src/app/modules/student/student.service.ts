import httpStatus from 'http-status';
import { cloudinary } from '../../../lib/cloudinary.ts';
import { prisma } from '../../../lib/prisma.ts';
import { AppError } from '../../utils/AppError.ts';
import type { UpdateStudentProfileInput } from './student.validation.ts';

// GetMyProfile
const getMyProfile = async (userId: string) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      studentId: true,
      profileImageUrl: true,
      phone: true,
      address: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student profile not found!');
  }

  return student;
};

// UpdateMyProfile
const updateMyProfile = async (
  userId: string,
  payload: UpdateStudentProfileInput,
) => {
  const existingStudent = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!existingStudent) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student profile not found!');
  }

  const { firstName, lastName, phone, address } = payload;

  const result = await prisma.$transaction(async transaction => {
    if (firstName !== undefined || lastName !== undefined) {
      await transaction.user.update({
        where: {
          id: userId,
        },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
        },
      });
    }

    await transaction.studentProfile.update({
      where: {
        userId,
      },
      data: {
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
    });

    return transaction.studentProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        studentId: true,
        profileImageUrl: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  });

  return result;
};

// UpdateProfilePhoto
const updateProfilePhoto = async (
  userId: string,
  file: Express.Multer.File,
) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      profileImagePublicId: true,
    },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student profile not found!');
  }

  const uploadImage = () =>
    new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'university-management/students',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new AppError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Failed to upload profile photo.',
              ),
            );
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

  const uploadedImage = await uploadImage();

  try {
    const updatedStudent = await prisma.studentProfile.update({
      where: {
        userId,
      },
      data: {
        profileImageUrl: uploadedImage.secure_url,
        profileImagePublicId: uploadedImage.public_id,
      },
      select: {
        id: true,
        studentId: true,
        profileImageUrl: true,
        profileImagePublicId: true,
      },
    });

    if (student.profileImagePublicId) {
      await cloudinary.uploader.destroy(student.profileImagePublicId);
    }

    return updatedStudent;
  } catch (error) {
    await cloudinary.uploader.destroy(uploadedImage.public_id);
    throw error;
  }
};

export const StudentService = {
  getMyProfile,
  updateMyProfile,
  updateProfilePhoto,
};
