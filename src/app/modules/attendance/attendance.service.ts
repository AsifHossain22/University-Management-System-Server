import httpStatus from 'http-status';
import { Prisma } from '../../../generated/prisma/client.ts';
import { prisma } from '../../../lib/prisma.ts';
import { AppError } from '../../utils/AppError.ts';
import type {
  AttendanceQueryInput,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from './attendance.validation.ts';

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

// GetAttendances
const getAttendances = async (
  instructorUserId: string,
  query: AttendanceQueryInput,
) => {
  const instructor = await prisma.instructorProfile.findUnique({
    where: {
      userId: instructorUserId,
    },
    select: {
      id: true,
    },
  });

  if (!instructor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Instructor profile not found!');
  }

  const { page = 1, limit = 10, status, date, searchTerm } = query;

  const skip = (page - 1) * limit;

  const attendanceDate = date ? new Date(date) : undefined;

  if (attendanceDate) {
    attendanceDate.setHours(0, 0, 0, 0);
  }

  const where: Prisma.AttendanceWhereInput = {
    registration: {
      section: {
        instructorId: instructor.id,
      },
    },

    ...(status && {
      status,
    }),

    ...(attendanceDate && {
      date: attendanceDate,
    }),

    ...(searchTerm && {
      OR: [
        {
          registration: {
            student: {
              studentId: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          registration: {
            student: {
              user: {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
        {
          registration: {
            student: {
              user: {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
        {
          registration: {
            section: {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          registration: {
            section: {
              code: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          registration: {
            section: {
              course: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
        {
          registration: {
            section: {
              course: {
                code: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      ],
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        date: 'desc',
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
    }),

    prisma.attendance.count({
      where,
    }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// UpdateAttendance
const updateAttendance = async (
  instructorUserId: string,
  attendanceId: string,
  payload: UpdateAttendanceInput,
) => {
  const instructor = await prisma.instructorProfile.findUnique({
    where: {
      userId: instructorUserId,
    },
    select: {
      id: true,
    },
  });

  if (!instructor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Instructor profile not found!');
  }

  const attendance = await prisma.attendance.findUnique({
    where: {
      id: attendanceId,
    },
    select: {
      id: true,
      registration: {
        select: {
          status: true,
          section: {
            select: {
              instructorId: true,
            },
          },
        },
      },
    },
  });

  if (!attendance) {
    throw new AppError(httpStatus.NOT_FOUND, 'Attendance record not found!');
  }

  if (attendance.registration.section.instructorId !== instructor.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not assigned to this section!',
    );
  }

  if (attendance.registration.status !== 'REGISTERED') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Attendance cannot be updated because the student's registration status is ${attendance.registration.status}.`,
    );
  }

  const updatedAttendance = await prisma.attendance.update({
    where: {
      id: attendanceId,
    },
    data: {
      ...(payload.status !== undefined && {
        status: payload.status,
      }),
      ...(payload.remarks !== undefined && {
        remarks: payload.remarks,
      }),
    },
    select: {
      id: true,
      date: true,
      status: true,
      remarks: true,
      markedAt: true,
      createdAt: true,
      updatedAt: true,
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

  return updatedAttendance;
};

export const AttendanceService = {
  createAttendance,
  getAttendances,
  updateAttendance,
};
