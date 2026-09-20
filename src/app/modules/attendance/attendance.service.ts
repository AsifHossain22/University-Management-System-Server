import httpStatus from 'http-status';
import { Prisma } from '../../../generated/prisma/client.ts';
import { prisma } from '../../../lib/prisma.ts';
import { AppError } from '../../utils/AppError.ts';
import type { CreateAttendanceInput } from './attendance.validation.ts';

// CreateAttendance
const createAttendance = async (
  instructorUserId: string,
  payload: CreateAttendanceInput,
) => {
  const instructor = await prisma.instructorProfile.findUnique({
    where: {
      userId: instructorUserId,
    },
    select: {
      id: true,
      instructorId: true,
    },
  });

  if (!instructor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Instructor profile not found!');
  }

  const registration = await prisma.courseRegistration.findUnique({
    where: {
      id: payload.registrationId,
    },
    select: {
      id: true,
      status: true,
      student: {
        select: {
          id: true,
          studentId: true,
        },
      },
      section: {
        select: {
          id: true,
          name: true,
          code: true,
          instructorId: true,
          course: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          semester: {
            select: {
              id: true,
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

  if (registration.section.instructorId !== instructor.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not assigned to this section!',
    );
  }

  if (registration.status !== 'REGISTERED') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Attendance cannot be marked because the student's registration status is ${registration.status}.`,
    );
  }

  const attendanceDate = new Date(payload.date);
  attendanceDate.setHours(0, 0, 0, 0);

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      registrationId_date: {
        registrationId: registration.id,
        date: attendanceDate,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingAttendance) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Attendance has already been marked for this student on this date!',
    );
  }

  try {
    const attendance = await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        date: attendanceDate,
        status: payload.status,
        remarks: payload.remarks ?? null,
      },
      select: {
        id: true,
        date: true,
        status: true,
        remarks: true,
        markedAt: true,
        createdAt: true,
        registration: {
          select: {
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
                course: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return attendance;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Attendance has already been marked for this student on this date!',
      );
    }

    throw error;
  }
};

export const AttendanceService = {
  createAttendance,
};
