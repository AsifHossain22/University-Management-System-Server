import httpStatus from 'http-status';
import { Prisma } from '../../../generated/prisma/client.ts';
import { prisma } from '../../../lib/prisma.ts';
import { AppError } from '../../utils/AppError.ts';
import type { CreateCourseRegistrationInput } from './course-registration.validation.ts';

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
        },
      );
    } catch (error) {
      // RetryFewTimesInsteadOfImmediatelyFailing
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
    'Course registration could not be completed because of concurrent registration activity. Please try again!',
  );
};

export const CourseRegistrationService = {
  registerCourse,
};
