import httpStatus from 'http-status';
import { prisma } from '../../../lib/prisma.ts';
import { cloudinary } from '../../../lib/cloudinary.ts';
import { AppError } from '../../utils/AppError.ts';
import type { UpdateInstructorProfileInput } from './instructor.validation.ts';

// GetMyProfile
const getMyProfile = async (userId: string) => {
  const instructorProfile = await prisma.instructorProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      userId: true,
      instructorId: true,
      profileImageUrl: true,
      profileImagePublicId: true,
      specialization: true,
      qualification: true,
      experienceYears: true,
      bio: true,
      phone: true,
      address: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!instructorProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Instructor profile not found!');
  }

  return instructorProfile;
};

// UpdateMyProfile
const updateMyProfile = async (
  userId: string,
  payload: UpdateInstructorProfileInput,
) => {
  const existingProfile = await prisma.instructorProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!existingProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Instructor profile not found!');
  }

  const updateData = {
    ...(payload.specialization !== undefined && {
      specialization: payload.specialization,
    }),
    ...(payload.qualification !== undefined && {
      qualification: payload.qualification,
    }),
    ...(payload.experienceYears !== undefined && {
      experienceYears: payload.experienceYears,
    }),
    ...(payload.bio !== undefined && {
      bio: payload.bio,
    }),
    ...(payload.phone !== undefined && {
      phone: payload.phone,
    }),
    ...(payload.address !== undefined && {
      address: payload.address,
    }),
  };

  const updatedProfile = await prisma.instructorProfile.update({
    where: {
      userId,
    },
    data: updateData,
    select: {
      id: true,
      userId: true,
      instructorId: true,
      profileImageUrl: true,
      profileImagePublicId: true,
      specialization: true,
      qualification: true,
      experienceYears: true,
      bio: true,
      phone: true,
      address: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedProfile;
};

// UpdateProfilePhoto
const updateProfilePhoto = async (
  userId: string,
  file: Express.Multer.File,
) => {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Profile photo is required!');
  }

  const existingProfile = await prisma.instructorProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      profileImageUrl: true,
      profileImagePublicId: true,
    },
  });

  if (!existingProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Instructor profile not found!');
  }

  const uploadToCloudinary = () =>
    new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'university-management/instructors',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result?.secure_url || !result.public_id) {
            reject(
              new Error(
                'Cloudinary did not return the required image information!',
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

  let uploadedImage: {
    secure_url: string;
    public_id: string;
  };

  try {
    uploadedImage = await uploadToCloudinary();
  } catch {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      'Profile photo upload failed. Please try again!',
    );
  }

  try {
    const updatedProfile = await prisma.instructorProfile.update({
      where: {
        userId,
      },
      data: {
        profileImageUrl: uploadedImage.secure_url,
        profileImagePublicId: uploadedImage.public_id,
      },
      select: {
        id: true,
        userId: true,
        instructorId: true,
        profileImageUrl: true,
        profileImagePublicId: true,
        specialization: true,
        qualification: true,
        experienceYears: true,
        bio: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (existingProfile.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(
          existingProfile.profileImagePublicId,
          {
            resource_type: 'image',
          },
        );
      } catch (error) {
        console.error(
          'Failed to delete previous instructor profile image from Cloudinary:',
          error,
        );
      }
    }

    return updatedProfile;
  } catch (error) {
    try {
      await cloudinary.uploader.destroy(uploadedImage.public_id, {
        resource_type: 'image',
      });
    } catch (cleanupError) {
      console.error(
        'Failed to clean up uploaded Cloudinary image:',
        cleanupError,
      );
    }

    throw error;
  }
};

export const InstructorService = {
  getMyProfile,
  updateMyProfile,
  updateProfilePhoto,
};
