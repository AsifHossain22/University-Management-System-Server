import httpStatus from 'http-status';
import { prisma } from '../../../lib/prisma.ts';
import { AppError } from '../../utils/AppError.ts';
import type {
  CreateSectionInput,
  SectionQueryInput,
  UpdateSectionInput,
} from './section.validation.ts';

// CreateSection
const createSection = async (payload: CreateSectionInput) => {
  const { courseId, semesterId, instructorId, code, capacity } = payload;

  // VerifyCourseExistsActiveAndNotDeleted
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      isActive: true,
      deletedAt: null,
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found!');
  }

  // VerifySemesterExistsActiveAndNotDeleted.
  const semester = await prisma.semester.findFirst({
    where: {
      id: semesterId,
      isActive: true,
      deletedAt: null,
    },
  });

  if (!semester) {
    throw new AppError(httpStatus.NOT_FOUND, 'Semester not found!');
  }

  // VerifyInstructorProfileExistsAndBelongsToActiveUser
  const instructor = await prisma.instructorProfile.findFirst({
    where: {
      id: instructorId,
      user: {
        role: 'INSTRUCTOR',
        isActive: true,
        deletedAt: null,
      },
    },
  });

  if (!instructor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Instructor not found!');
  }

  // SectionCodeMustUniqueWithinSemester
  const existingSection = await prisma.section.findFirst({
    where: {
      code,
      semesterId,
      deletedAt: null,
    },
  });

  if (existingSection) {
    throw new AppError(
      httpStatus.CONFLICT,
      'A section with this code already exists in this semester!',
    );
  }

  return prisma.section.create({
    data: {
      name: payload.name,
      code,
      courseId,
      semesterId,
      instructorId,
      capacity,
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          credits: true,
        },
      },
      semester: {
        select: {
          id: true,
          name: true,
          code: true,
          startDate: true,
          endDate: true,
        },
      },
      instructor: {
        select: {
          id: true,
          instructorId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });
};

// GetAllSections
const getSections = async (query: SectionQueryInput) => {
  const {
    searchTerm,
    courseId,
    semesterId,
    instructorId,
    isActive,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(searchTerm
      ? {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: 'insensitive' as const,
              },
            },
            {
              code: {
                contains: searchTerm,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
    ...(courseId ? { courseId } : {}),
    ...(semesterId ? { semesterId } : {}),
    ...(instructorId ? { instructorId } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  const [sections, total] = await prisma.$transaction([
    prisma.section.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        instructor: {
          select: {
            id: true,
            instructorId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.section.count({
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
    data: sections,
  };
};

// GetSectionById
const getSectionById = async (sectionId: string) => {
  const section = await prisma.section.findFirst({
    where: {
      id: sectionId,
      deletedAt: null,
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          credits: true,
        },
      },
      semester: {
        select: {
          id: true,
          name: true,
          code: true,
          startDate: true,
          endDate: true,
        },
      },
      instructor: {
        select: {
          id: true,
          instructorId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!section) {
    throw new AppError(httpStatus.NOT_FOUND, 'Section not found!');
  }

  return section;
};

// UpdateSection
const updateSection = async (
  sectionId: string,
  payload: UpdateSectionInput,
) => {
  const existingSection = await prisma.section.findFirst({
    where: {
      id: sectionId,
      deletedAt: null,
    },
  });

  if (!existingSection) {
    throw new AppError(httpStatus.NOT_FOUND, 'Section not found!');
  }

  const nextCourseId = payload.courseId ?? existingSection.courseId;
  const nextSemesterId = payload.semesterId ?? existingSection.semesterId;
  const nextInstructorId = payload.instructorId ?? existingSection.instructorId;

  // VerifyNextCourseIfChanged
  if (payload.courseId !== undefined) {
    const course = await prisma.course.findFirst({
      where: {
        id: nextCourseId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!course) {
      throw new AppError(httpStatus.NOT_FOUND, 'Course not found!');
    }
  }

  // VerifyNextSemesterIfChanged
  if (payload.semesterId !== undefined) {
    const semester = await prisma.semester.findFirst({
      where: {
        id: nextSemesterId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!semester) {
      throw new AppError(httpStatus.NOT_FOUND, 'Semester not found!');
    }
  }

  // VerifyNextInstructorIfChanged
  if (payload.instructorId !== undefined) {
    const instructor = await prisma.instructorProfile.findFirst({
      where: {
        id: nextInstructorId,
        user: {
          role: 'INSTRUCTOR',
          isActive: true,
          deletedAt: null,
        },
      },
    });

    if (!instructor) {
      throw new AppError(httpStatus.NOT_FOUND, 'Instructor not found!');
    }
  }

  const nextCode = payload.code ?? existingSection.code;

  // CheckUniquenessWhenCodeOrSemesterChanges
  if (payload.code !== undefined || payload.semesterId !== undefined) {
    const duplicateSection = await prisma.section.findFirst({
      where: {
        code: nextCode,
        semesterId: nextSemesterId,
        deletedAt: null,
        id: {
          not: sectionId,
        },
      },
    });

    if (duplicateSection) {
      throw new AppError(
        httpStatus.CONFLICT,
        'A section with this code already exists in this semester!',
      );
    }
  }

  return prisma.section.update({
    where: {
      id: sectionId,
    },
    data: {
      ...(payload.name !== undefined && {
        name: payload.name,
      }),
      ...(payload.code !== undefined && {
        code: payload.code,
      }),
      ...(payload.courseId !== undefined && {
        courseId: payload.courseId,
      }),
      ...(payload.semesterId !== undefined && {
        semesterId: payload.semesterId,
      }),
      ...(payload.instructorId !== undefined && {
        instructorId: payload.instructorId,
      }),
      ...(payload.capacity !== undefined && {
        capacity: payload.capacity,
      }),
      ...(payload.isActive !== undefined && {
        isActive: payload.isActive,
      }),
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          credits: true,
        },
      },
      semester: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      instructor: {
        select: {
          id: true,
          instructorId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });
};

// DeleteSection
const softDeleteSection = async (sectionId: string) => {
  const existingSection = await prisma.section.findFirst({
    where: {
      id: sectionId,
      deletedAt: null,
    },
  });

  if (!existingSection) {
    throw new AppError(httpStatus.NOT_FOUND, 'Section not found!');
  }

  return prisma.section.update({
    where: {
      id: sectionId,
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });
};

export const SectionService = {
  createSection,
  getSections,
  getSectionById,
  updateSection,
  softDeleteSection,
};
