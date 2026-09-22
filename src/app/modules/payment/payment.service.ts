import httpStatus from 'http-status';
import config from '../../config/index.ts';
import { bkashUtils } from '../../../lib/bkash.ts';
import { prisma } from '../../../lib/prisma.ts';
import { AppError } from '../../utils/AppError.ts';
import type { Prisma } from '../../../generated/prisma/client.ts';
import type {
  ICreatePaymentPayload,
  IPaymentCallbackPayload,
} from './payment.interface.ts';

const generateMerchantInvoiceNumber = () => {
  return `UNI-${Date.now()}-${crypto.randomUUID()}`;
};

// CreatePayment
const createPayment = async (
  userId: string,
  payload: ICreatePaymentPayload,
) => {
  const { feeId, amount } = payload;

  // FindAuthenticatedStudentProfile
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
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
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student profile not found!');
  }

  // FindActiveAndNonDeletedFeeBelongingStudent
  const fee = await prisma.fee.findFirst({
    where: {
      id: feeId,
      studentId: student.id,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      studentId: true,
      title: true,
      amount: true,
      dueDate: true,
      status: true,
    },
  });

  if (!fee) {
    throw new AppError(httpStatus.NOT_FOUND, 'Fee not found!');
  }

  if (fee.status === 'CANCELLED') {
    throw new AppError(httpStatus.BAD_REQUEST, 'This fee has been cancelled!');
  }

  if (fee.status === 'PAID') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This fee has already been fully paid!',
    );
  }

  // OnlySuccessfullyCompletedPaymentsReduceFeeBalance
  const paidPayments = await prisma.payment.aggregate({
    where: {
      feeId: fee.id,
      studentId: student.id,
      status: 'PAID',
    },
    _sum: {
      amount: true,
    },
  });

  const totalPaid = paidPayments._sum.amount ?? 0;

  const outstandingAmount = Math.max(fee.amount - totalPaid, 0);

  if (outstandingAmount <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This fee has no outstanding balance!',
    );
  }

  if (amount > outstandingAmount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Payment amount cannot exceed the outstanding balance of ${outstandingAmount} BDT.`,
    );
  }

  const merchantInvoiceNumber = generateMerchantInvoiceNumber();

  // CreateInternalPaymentRecordBeforeContactingBKash
  const payment = await prisma.payment.create({
    data: {
      feeId: fee.id,
      studentId: student.id,
      amount,
      currency: 'BDT',
      paymentMethod: 'BKASH',
      status: 'PENDING',
      merchantInvoiceNumber,
      payerReference: student.studentEmail,
    },
  });

  try {
    // CreatePaymentSessionAtBKash
    const bkashPayment = await bkashUtils.createPayment({
      mode: '0011',
      payerReference: student.studentEmail,
      callbackURL: `${config.bkash_callback_url}/callback`,
      amount: amount.toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber,
    });

    // SaveBKashPaymentIDAndGatewayResponseLocally
    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        bkashPaymentId: bkashPayment.paymentID,
        gatewayResponse: {
          paymentID: bkashPayment.paymentID,
          bkashURL: bkashPayment.bkashURL,
          transactionStatus: bkashPayment.transactionStatus,
          amount: bkashPayment.amount,
          currency: bkashPayment.currency,
          merchantInvoiceNumber: bkashPayment.merchantInvoiceNumber,
        },
      },
    });

    return {
      payment: updatedPayment,
      paymentUrl: bkashPayment.bkashURL,
    };
  } catch (error) {
    // KeepFailedGatewayAttemptInDatabase
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        gatewayResponse:
          error instanceof Error
            ? {
                message: error.message,
              }
            : {
                message: 'Unknown bKash error!',
              },
      },
    });

    throw error;
  }
};

// BKashPaymentCallback
const handlePaymentCallback = async (payload: IPaymentCallbackPayload) => {
  const { paymentID, status } = payload;

  // FindLocalPayment
  const payment = await prisma.payment.findUnique({
    where: {
      bkashPaymentId: paymentID,
    },
    select: {
      id: true,
      feeId: true,
      studentId: true,
      amount: true,
      currency: true,
      status: true,
      merchantInvoiceNumber: true,
      bkashPaymentId: true,
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment record not found!');
  }

  // NoDuplicatePayment
  if (payment.status === 'PAID') {
    return {
      paymentId: payment.id,
      status: 'PAID',
      message: 'Payment has already been processed!',
    };
  }

  if (!payment.bkashPaymentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'bKash payment ID is missing from the local payment record!',
    );
  }

  // SuccessfulCallback
  if (status === 'success') {
    const bkashPayment = await bkashUtils.executePayment(paymentID);

    // VerifyBKashPaymentID
    if (bkashPayment.paymentID !== paymentID) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'bKash payment ID verification failed!',
      );
    }

    // VerifyMerchantInvoiceNumber
    if (
      bkashPayment.merchantInvoiceNumber &&
      bkashPayment.merchantInvoiceNumber !== payment.merchantInvoiceNumber
    ) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'bKash merchant invoice verification failed!',
      );
    }

    // VerifyPaymentAmount
    if (
      bkashPayment.amount &&
      Number(bkashPayment.amount).toFixed(2) !== payment.amount.toFixed(2)
    ) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'bKash payment amount verification failed!',
      );
    }

    // VerifyPaymentCurrency
    if (bkashPayment.currency && bkashPayment.currency !== payment.currency) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'bKash payment currency verification failed!',
      );
    }

    // BKashPaymentCompletedThenPaymentStatusPAID
    if (bkashPayment.transactionStatus === 'Completed') {
      if (!bkashPayment.trxID) {
        throw new AppError(
          httpStatus.BAD_GATEWAY,
          'bKash transaction ID is missing!',
        );
      }

      // BKashTransactionID
      const bkashTrxId = bkashPayment.trxID;

      const finalizedPayment = await prisma.$transaction(async tx => {
        const paymentUpdate = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: 'PENDING',
          },
          data: {
            status: 'PAID',
            bkashPaymentId: paymentID,
            bkashTrxId,
            paidAt: new Date(),
            gatewayResponse: {
              paymentID: bkashPayment.paymentID,
              trxID: bkashTrxId,
              transactionStatus: bkashPayment.transactionStatus,
              amount: bkashPayment.amount,
              currency: bkashPayment.currency,
              merchantInvoiceNumber: bkashPayment.merchantInvoiceNumber,
              statusCode: '0000',
            },
          },
        });

        if (paymentUpdate.count === 0) {
          return tx.payment.findUnique({
            where: {
              id: payment.id,
            },
          });
        }

        const paidPayments = await tx.payment.aggregate({
          where: {
            feeId: payment.feeId,
            studentId: payment.studentId,
            status: 'PAID',
          },
          _sum: {
            amount: true,
          },
        });

        const totalPaid = paidPayments._sum.amount ?? 0;

        const fee = await tx.fee.findUnique({
          where: {
            id: payment.feeId,
          },
          select: {
            id: true,
            amount: true,
            status: true,
          },
        });

        if (!fee) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            'Fee not found while finalizing payment!',
          );
        }

        const newFeeStatus =
          totalPaid >= fee.amount ? 'PAID' : 'PARTIALLY_PAID';

        await tx.fee.update({
          where: {
            id: fee.id,
          },
          data: {
            status: newFeeStatus,
          },
        });

        return tx.payment.findUnique({
          where: {
            id: payment.id,
          },
        });
      });

      return {
        payment: finalizedPayment,
        status: 'PAID',
        message: 'Payment verified and completed successfully!',
      };
    }

    const paymentStatus =
      bkashPayment.transactionStatus === 'Cancelled' ? 'CANCELLED' : 'FAILED';

    const gatewayResponse = {
      paymentID: bkashPayment.paymentID,
      transactionStatus: bkashPayment.transactionStatus,
      ...(bkashPayment.trxID && {
        trxID: bkashPayment.trxID,
      }),
      ...(bkashPayment.amount && {
        amount: bkashPayment.amount,
      }),
      ...(bkashPayment.currency && {
        currency: bkashPayment.currency,
      }),
      ...(bkashPayment.merchantInvoiceNumber && {
        merchantInvoiceNumber: bkashPayment.merchantInvoiceNumber,
      }),
    };

    const failureUpdateData: Prisma.PaymentUpdateManyMutationInput =
      paymentStatus === 'CANCELLED'
        ? {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            gatewayResponse,
          }
        : {
            status: 'FAILED',
            failedAt: new Date(),
            gatewayResponse,
          };

    const updatedPayment = await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: 'PENDING',
      },
      data: failureUpdateData,
    });

    return {
      paymentId: payment.id,
      status: updatedPayment.count > 0 ? paymentStatus : payment.status,
      message:
        paymentStatus === 'CANCELLED'
          ? 'Payment was cancelled.'
          : 'Payment was not completed.',
    };
  }

  const paymentStatus = status === 'cancel' ? 'CANCELLED' : 'FAILED';

  const failureUpdateData: Prisma.PaymentUpdateManyMutationInput =
    paymentStatus === 'CANCELLED'
      ? {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          gatewayResponse: {
            paymentID: paymentID,
            callbackStatus: status,
            message: 'bKash callback reported cancellation.',
          },
        }
      : {
          status: 'FAILED',
          failedAt: new Date(),
          gatewayResponse: {
            paymentID: paymentID,
            callbackStatus: status,
            message: 'bKash callback reported payment failure.',
          },
        };

  const updatedPayment = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      status: 'PENDING',
    },
    data: failureUpdateData,
  });

  return {
    paymentId: payment.id,
    status: updatedPayment.count > 0 ? paymentStatus : payment.status,
    message:
      paymentStatus === 'CANCELLED'
        ? 'Payment was cancelled.'
        : 'Payment was not completed.',
  };
};

export const PaymentService = {
  createPayment,
  handlePaymentCallback,
};
