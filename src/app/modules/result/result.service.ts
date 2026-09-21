import httpStatus from 'http-status';
import type { Prisma } from '../../../generated/prisma/client.ts';
import { prisma } from '../../../lib/prisma.ts';
import { AppError } from '../../utils/AppError.ts';
import type {
  ICreateResult,
  IResultFilterRequest,
  IUpdateResult,
} from './result.interface.ts';

// CreateResult
const createResult = async (
  userId: string,
  userRole: 'ADMIN' | 'INSTRUCTOR',
  payload: ICreateResult,
) => {
  const { registrationId, examId, obtainedMarks, remarks } = payload;

  const registration = await prisma.courseRegistration.findUnique({
    where: { id: registrationId },
    include: {
      student: {
        select: {
          id: true,
          studentId: true,
          studentEmail: true,
          userId: true,
        },
      },
      section: {
        select: {
          id: true,
          instructorId: true,
          course: {
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

  if (
    registration.status !== 'REGISTERED' &&
    registration.status !== 'COMPLETED'
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Result cannot be added for this registration.',
    );
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      sectionId: true,
      title: true,
      totalMarks: true,
      isActive: true,
      deletedAt: true,
    },
  });

  if (!exam || exam.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, 'Exam not found!');
  }

  if (!exam.isActive) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot add a result for an inactive exam.',
    );
  }

  if (registration.sectionId !== exam.sectionId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'The exam does not belong to the registered section.',
    );
  }

  if (obtainedMarks > exam.totalMarks) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Obtained marks cannot exceed the exam total marks of ${exam.totalMarks}.`,
    );
  }

  if (userRole === 'INSTRUCTOR') {
    const instructorProfile = await prisma.instructorProfile.findUnique({
      where: { userId },
      select: {
        id: true,
      },
    });

    if (!instructorProfile) {
      throw new AppError(httpStatus.NOT_FOUND, 'Instructor profile not found!');
    }

    if (registration.section.instructorId !== instructorProfile.id) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You can only manage results for your assigned sections.',
      );
    }
  }

  const existingResult = await prisma.result.findUnique({
    where: {
      registrationId_examId: {
        registrationId,
        examId,
      },
    },
  });

  if (existingResult?.isActive) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Result already exists for this student and exam!',
    );
  }

  // Restore a previously soft-deleted result.
  if (existingResult && !existingResult.isActive) {
    return prisma.result.update({
      where: { id: existingResult.id },
      data: {
        obtainedMarks,
        remarks: remarks ?? null,
        isActive: true,
        deletedAt: null,
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            type: true,
            totalMarks: true,
          },
        },
        registration: {
          select: {
            id: true,
            status: true,
            student: {
              select: {
                studentId: true,
                studentEmail: true,
              },
            },
          },
        },
      },
    });
  }

  return prisma.result.create({
    data: {
      registrationId,
      examId,
      obtainedMarks,
      remarks: remarks ?? null,
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          type: true,
          totalMarks: true,
        },
      },
      registration: {
        select: {
          id: true,
          status: true,
          student: {
            select: {
              studentId: true,
              studentEmail: true,
            },
          },
        },
      },
    },
  });
};

// GetResults
const getResults = async (
  userId: string,
  userRole: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT',
  filters: IResultFilterRequest,
) => {
  const {
    searchTerm,
    registrationId,
    examId,
    studentId,
    sectionId,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (page - 1) * limit;

  const where: Prisma.ResultWhereInput = {
    isActive: true,
    deletedAt: null,
  };

  if (registrationId) {
    where.registrationId = registrationId;
  }

  if (examId) {
    where.examId = examId;
  }

  if (studentId) {
    where.registration = {
      student: {
        id: studentId,
      },
    };
  }

  const examWhere: Prisma.ExamWhereInput = {
    isActive: true,
    deletedAt: null,
  };

  if (sectionId) {
    examWhere.sectionId = sectionId;
  }

  if (userRole === 'INSTRUCTOR') {
    const instructorProfile = await prisma.instructorProfile.findUnique({
      where: { userId },
      select: {
        id: true,
      },
    });

    if (!instructorProfile) {
      throw new AppError(httpStatus.NOT_FOUND, 'Instructor profile not found!');
    }

    examWhere.section = {
      instructorId: instructorProfile.id,
    };
  }

  where.exam = examWhere;

  if (searchTerm) {
    where.OR = [
      {
        remarks: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
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
            studentEmail: {
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
        exam: {
          title: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  if (userRole === 'STUDENT') {
    where.registration = {
      student: {
        userId,
      },
    };
  }

  const orderBy: Prisma.ResultOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [data, total] = await prisma.$transaction([
    prisma.result.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            type: true,
            examDate: true,
            totalMarks: true,
            weight: true,
            section: {
              select: {
                id: true,
                name: true,
                code: true,
                course: {
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
        registration: {
          select: {
            id: true,
            status: true,
            student: {
              select: {
                id: true,
                studentId: true,
                studentEmail: true,
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
    prisma.result.count({ where }),
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

// GetResultByID
const getResultById = async (
  userId: string,
  userRole: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT',
  resultId: string,
) => {
  const result = await prisma.result.findFirst({
    where: {
      id: resultId,
      isActive: true,
      deletedAt: null,
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          type: true,
          examDate: true,
          totalMarks: true,
          passingMarks: true,
          weight: true,
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
            },
          },
        },
      },
      registration: {
        select: {
          id: true,
          status: true,
          student: {
            select: {
              id: true,
              userId: true,
              studentId: true,
              studentEmail: true,
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
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Result not found.');
  }

  if (userRole === 'INSTRUCTOR') {
    const instructorProfile = await prisma.instructorProfile.findUnique({
      where: { userId },
      select: {
        id: true,
      },
    });

    if (!instructorProfile) {
      throw new AppError(httpStatus.NOT_FOUND, 'Instructor profile not found!');
    }

    if (result.exam.section.instructorId !== instructorProfile.id) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You can only view results for your assigned sections.',
      );
    }
  }

  if (userRole === 'STUDENT' && result.registration.student.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You can only view your own results.',
    );
  }

  return result;
};

// UpdateResult
const updateResult = async (
  userId: string,
  userRole: 'ADMIN' | 'INSTRUCTOR',
  resultId: string,
  payload: IUpdateResult,
) => {
  const existingResult = await prisma.result.findFirst({
    where: {
      id: resultId,
      isActive: true,
      deletedAt: null,
    },
    include: {
      exam: {
        select: {
          id: true,
          totalMarks: true,
          section: {
            select: {
              instructorId: true,
            },
          },
        },
      },
    },
  });

  if (!existingResult) {
    throw new AppError(httpStatus.NOT_FOUND, 'Result not found.');
  }

  if (userRole === 'INSTRUCTOR') {
    const instructorProfile = await prisma.instructorProfile.findUnique({
      where: { userId },
      select: {
        id: true,
      },
    });

    if (!instructorProfile) {
      throw new AppError(httpStatus.NOT_FOUND, 'Instructor profile not found!');
    }

    if (existingResult.exam.section.instructorId !== instructorProfile.id) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You can only update results for your assigned sections.',
      );
    }
  }

  if (
    payload.obtainedMarks !== undefined &&
    payload.obtainedMarks > existingResult.exam.totalMarks
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Obtained marks cannot exceed the exam total marks of ${existingResult.exam.totalMarks}.`,
    );
  }

  return prisma.result.update({
    where: { id: resultId },
    data: {
      ...(payload.obtainedMarks !== undefined && {
        obtainedMarks: payload.obtainedMarks,
      }),
      ...(payload.remarks !== undefined && {
        remarks: payload.remarks,
      }),
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          type: true,
          totalMarks: true,
        },
      },
      registration: {
        select: {
          id: true,
          status: true,
          student: {
            select: {
              studentId: true,
              studentEmail: true,
            },
          },
        },
      },
    },
  });
};

// DeleteResult
const deleteResult = async (resultId: string) => {
  const existingResult = await prisma.result.findFirst({
    where: {
      id: resultId,
      isActive: true,
      deletedAt: null,
    },
  });

  if (!existingResult) {
    throw new AppError(httpStatus.NOT_FOUND, 'Result not found!');
  }

  return prisma.result.update({
    where: { id: resultId },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });
};

export const ResultService = {
  createResult,
  getResults,
  getResultById,
  updateResult,
  deleteResult,
};
