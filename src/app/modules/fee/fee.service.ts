import httpStatus from 'http-status';
import { prisma } from '../../../lib/prisma.ts';
import { AppError } from '../../utils/AppError.ts';
import type {
  ICreateFeePayload,
  IFeeQuery,
  IUpdateFeePayload,
} from './fee.interface.ts';

// createFee
const createFee = async (payload: ICreateFeePayload) => {
  const { studentId, title, description, amount, dueDate } = payload;

  const student = await prisma.studentProfile.findUnique({
    where: {
      id: studentId,
    },
    select: {
      id: true,
      studentId: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student profile not found!');
  }

  if (!student.user.isActive || student.user.deletedAt) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot create a fee for an inactive student!',
    );
  }

  const fee = await prisma.fee.create({
    data: {
      studentId: student.id,
      title,
      description: description ?? null,
      amount,
      dueDate,
      status: 'UNPAID',
    },
    select: {
      id: true,
      studentId: true,
      title: true,
      description: true,
      amount: true,
      dueDate: true,
      status: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      student: {
        select: {
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
  });

  return fee;
};

// GetAllFees
const getAllFees = async (query: IFeeQuery) => {
  const {
    searchTerm,
    studentId,
    status,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(studentId ? { studentId } : {}),
    ...(status ? { status } : {}),
    ...(searchTerm
      ? {
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: 'insensitive' as const,
              },
            },
            {
              description: {
                contains: searchTerm,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };

  const [fees, total] = await Promise.all([
    prisma.fee.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        studentId: true,
        title: true,
        description: true,
        amount: true,
        dueDate: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
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
    }),
    prisma.fee.count({
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
    data: fees,
  };
};

// GetMyFees
const getMyFees = async (userId: string, query: IFeeQuery) => {
  const {
    searchTerm,
    status,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

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

  const skip = (page - 1) * limit;

  const where = {
    studentId: student.id,
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(searchTerm
      ? {
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: 'insensitive' as const,
              },
            },
            {
              description: {
                contains: searchTerm,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };

  const [fees, total] = await Promise.all([
    prisma.fee.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        title: true,
        description: true,
        amount: true,
        dueDate: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        payments: {
          where: {
            status: 'PAID',
          },
          select: {
            id: true,
            amount: true,
            paidAt: true,
            bkashTrxId: true,
          },
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
    }),
    prisma.fee.count({
      where,
    }),
  ]);

  const data = fees.map(fee => {
    const totalPaid = fee.payments.reduce(
      (sum: number, payment: { amount: number }) => sum + payment.amount,
      0,
    );

    return {
      ...fee,
      totalPaid,
      outstandingAmount: Math.max(fee.amount - totalPaid, 0),
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

// GetSingleFee
const getSingleFee = async (
  feeId: string,
  userId: string,
  isAdmin: boolean,
) => {
  let studentId: string | undefined;

  if (!isAdmin) {
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

    studentId = student.id;
  }

  const fee = await prisma.fee.findFirst({
    where: {
      id: feeId,
      deletedAt: null,
      ...(studentId ? { studentId } : {}),
    },
    select: {
      id: true,
      studentId: true,
      title: true,
      description: true,
      amount: true,
      dueDate: true,
      status: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      student: {
        select: {
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
  });

  if (!fee) {
    throw new AppError(httpStatus.NOT_FOUND, 'Fee not found!');
  }

  const paidPayments = await prisma.payment.aggregate({
    where: {
      feeId: fee.id,
      studentId: fee.studentId,
      status: 'PAID',
    },
    _sum: {
      amount: true,
    },
  });

  const totalPaid = paidPayments._sum.amount ?? 0;

  return {
    ...fee,
    totalPaid,
    outstandingAmount: Math.max(fee.amount - totalPaid, 0),
  };
};

// UpdateFee
const updateFee = async (feeId: string, payload: IUpdateFeePayload) => {
  const existingFee = await prisma.fee.findFirst({
    where: {
      id: feeId,
      deletedAt: null,
    },
  });

  if (!existingFee) {
    throw new AppError(httpStatus.NOT_FOUND, 'Fee not found!');
  }

  if (existingFee.status === 'PAID' && payload.amount !== undefined) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'A fully paid fee amount cannot be changed!',
    );
  }

  const updateData = {
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.description !== undefined
      ? { description: payload.description }
      : {}),
    ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
    ...(payload.dueDate !== undefined ? { dueDate: payload.dueDate } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
  };

  const fee = await prisma.fee.update({
    where: {
      id: feeId,
    },
    data: updateData,
    select: {
      id: true,
      studentId: true,
      title: true,
      description: true,
      amount: true,
      dueDate: true,
      status: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return fee;
};

// DeleteFee
const deleteFee = async (feeId: string) => {
  const existingFee = await prisma.fee.findFirst({
    where: {
      id: feeId,
      deletedAt: null,
    },
  });

  if (!existingFee) {
    throw new AppError(httpStatus.NOT_FOUND, 'Fee not found!');
  }

  if (existingFee.status === 'PAID') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'A fully paid fee cannot be deleted!',
    );
  }

  await prisma.fee.update({
    where: {
      id: feeId,
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  return null;
};

export const FeeService = {
  createFee,
  getAllFees,
  getMyFees,
  getSingleFee,
  updateFee,
  deleteFee,
};
