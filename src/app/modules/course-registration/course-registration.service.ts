import httpStatus from 'http-status';
import { Prisma } from '../../../generated/prisma/client.ts';
import { prisma } from '../../../lib/prisma.ts';
import { AppError } from '../../utils/AppError.ts';
import type {
  CourseRegistrationQueryInput,
  CreateCourseRegistrationInput,
} from './course-registration.validation.ts';

// RegisterCourse
const registerCourse = async (
  userId: string,
  payload: CreateCourseRegistrationInput,
) => {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(
        async tx => {
          // FindAuthenticatedStudentProfile
          const student = await tx.studentProfile.findUnique({
            where: {
              userId,
            },
            select: {
              id: true,
              studentId: true,
            },
          });

          if (!student) {
            throw new AppError(
              httpStatus.NOT_FOUND,
              'Student profile not found!',
            );
          }

          // FindRequestedSectionAndRelatedCourseSemesterAndPrerequisite
          const section = await tx.section.findUnique({
            where: {
              id: payload.sectionId,
            },
            select: {
              id: true,
              name: true,
              code: true,
              capacity: true,
              isActive: true,
              deletedAt: true,
              course: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  credits: true,
                  isActive: true,
                  deletedAt: true,
                  prerequisites: {
                    select: {
                      prerequisiteId: true,
                      prerequisite: {
                        select: {
                          id: true,
                          name: true,
                          code: true,
                        },
                      },
                    },
                  },
                },
              },
              semester: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  isActive: true,
                  deletedAt: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          });

          if (!section) {
            throw new AppError(httpStatus.NOT_FOUND, 'Section not found!');
          }

          // SectionMustActiveAndNotDeleted
          if (!section.isActive || section.deletedAt) {
            throw new AppError(
              httpStatus.BAD_REQUEST,
              'This section is not available for registration!',
            );
          }

          // CourseMustActiveAndNotDeleted
          if (!section.course.isActive || section.course.deletedAt) {
            throw new AppError(
              httpStatus.BAD_REQUEST,
              'This course is not currently available!',
            );
          }

          // SemesterMustCurrentlyActive
          const now = new Date();

          if (
            !section.semester.isActive ||
            section.semester.deletedAt ||
            now < section.semester.startDate ||
            now > section.semester.endDate
          ) {
            throw new AppError(
              httpStatus.BAD_REQUEST,
              'This semester is not currently open for registration!',
            );
          }

          // PreventDuplicateRegistration
          const existingRegistration = await tx.courseRegistration.findUnique({
            where: {
              studentId_sectionId: {
                studentId: student.id,
                sectionId: section.id,
              },
            },
            select: {
              id: true,
              status: true,
            },
          });

          if (existingRegistration) {
            throw new AppError(
              httpStatus.CONFLICT,
              `You already have a ${existingRegistration.status.toLowerCase()} registration for this section.`,
            );
          }

          // CheckCurrentSectionCapacity
          const registeredStudentCount = await tx.courseRegistration.count({
            where: {
              sectionId: section.id,
              status: 'REGISTERED',
            },
          });

          if (registeredStudentCount >= section.capacity) {
            throw new AppError(
              httpStatus.CONFLICT,
              'This section is already full!',
            );
          }

          // CheckCoursePrerequisites
          if (section.course.prerequisites.length > 0) {
            const prerequisiteCourseIds = section.course.prerequisites.map(
              prerequisite => prerequisite.prerequisiteId,
            );

            // FindAllPrerequisiteCoursesStudentHasAlreadyPassed
            const passedPrerequisiteRegistrations =
              await tx.courseGrade.findMany({
                where: {
                  isPassed: true,
                  registration: {
                    studentId: student.id,
                    status: 'COMPLETED',
                    section: {
                      courseId: {
                        in: prerequisiteCourseIds,
                      },
                    },
                  },
                },
                select: {
                  registration: {
                    select: {
                      section: {
                        select: {
                          courseId: true,
                        },
                      },
                    },
                  },
                },
              });

            const passedCourseIds = new Set(
              passedPrerequisiteRegistrations.map(
                result => result.registration.section.courseId,
              ),
            );

            const missingPrerequisites = section.course.prerequisites.filter(
              prerequisite => !passedCourseIds.has(prerequisite.prerequisiteId),
            );

            if (missingPrerequisites.length > 0) {
              const prerequisiteNames = missingPrerequisites.map(
                prerequisite =>
                  `${prerequisite.prerequisite.name} (${prerequisite.prerequisite.code})`,
              );

              throw new AppError(
                httpStatus.BAD_REQUEST,
                `You must complete the following prerequisite course(s) first: ${prerequisiteNames.join(', ')}`,
              );
            }
          }

          // CreateCourseRegistration
          const registration = await tx.courseRegistration.create({
            data: {
              studentId: student.id,
              sectionId: section.id,
              status: 'REGISTERED',
            },
            select: {
              id: true,
              status: true,
              registeredAt: true,
              student: {
                select: {
                  studentId: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
              section: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  capacity: true,
                  course: {
                    select: {
                      name: true,
                      code: true,
                      credits: true,
                    },
                  },
                  semester: {
                    select: {
                      name: true,
                      code: true,
                    },
                  },
                },
              },
            },
          });

          return registration;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15000,
          maxWait: 5000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt < maxRetries
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError(
    httpStatus.CONFLICT,
    'Course registration could not be completed because of concurrent registration activity. Please try again.',
  );
};

// GetMyRegistrations
const getMyRegistrations = async (
  userId: string,
  query: CourseRegistrationQueryInput,
) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student profile not found!');
  }

  const { page, limit, status, searchTerm } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.CourseRegistrationWhereInput = {
    studentId: student.id,

    ...(status && {
      status,
    }),

    ...(searchTerm && {
      section: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            code: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            course: {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
          {
            course: {
              code: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
    }),
  };

  const [registrations, total] = await prisma.$transaction([
    prisma.courseRegistration.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        registeredAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        registeredAt: true,
        droppedAt: true,
        section: {
          select: {
            id: true,
            name: true,
            code: true,
            capacity: true,
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
        },
      },
    }),

    prisma.courseRegistration.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: registrations,
  };
};

// DropCourse
const dropCourse = async (userId: string, registrationId: string) => {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student profile not found!');
  }

  const registration = await prisma.courseRegistration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      studentId: true,
      status: true,
      section: {
        select: {
          id: true,
          name: true,
          code: true,
          course: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  if (!registration) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course registration not found!');
  }

  if (registration.studentId !== student.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You do not have permission to drop this course registration!',
    );
  }

  if (registration.status !== 'REGISTERED') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This course registration cannot be dropped because its current status is ${registration.status}.`,
    );
  }

  const result = await prisma.$transaction(async tx => {
    const updatedRegistration = await tx.courseRegistration.update({
      where: {
        id: registration.id,
      },
      data: {
        status: 'DROPPED',
        droppedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        registeredAt: true,
        droppedAt: true,
        section: {
          select: {
            id: true,
            name: true,
            code: true,
            course: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return updatedRegistration;
  });

  return result;
};

export const CourseRegistrationService = {
  registerCourse,
  getMyRegistrations,
  dropCourse,
};
