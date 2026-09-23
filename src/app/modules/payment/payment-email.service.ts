import { transporter } from '../../../lib/nodemailer.ts';
import config from '../../config/index.ts';

interface IPaymentSuccessEmailPayload {
  studentName: string;
  studentEmail: string;
  invoiceNumber: string;
  invoiceUrl: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  bkashTrxId?: string | null;
  pdfBuffer: Buffer;
}

const sendPaymentSuccessEmail = async (
  payload: IPaymentSuccessEmailPayload,
) => {
  const {
    studentName,
    studentEmail,
    invoiceNumber,
    invoiceUrl,
    amount,
    currency,
    paymentMethod,
    bkashTrxId,
    pdfBuffer,
  } = payload;

  await transporter.sendMail({
    from: config.smtp_user,
    to: studentEmail,
    subject: 'University Payment Successful - Invoice',
    html: `
			<div style="font-family: Arial, sans-serif; line-height: 1.6;">
				<h2>Payment Successful</h2>

				<p>Dear ${studentName},</p>

				<p>
					Your payment has been successfully completed.
					Please find your payment invoice attached to this email.
				</p>

				<h3>Payment Details</h3>

				<table style="border-collapse: collapse;">
					<tr>
						<td style="padding: 6px 12px 6px 0;"><strong>Invoice Number:</strong></td>
						<td>${invoiceNumber}</td>
					</tr>

					<tr>
						<td style="padding: 6px 12px 6px 0;"><strong>Amount:</strong></td>
						<td>${currency} ${amount.toFixed(2)}</td>
					</tr>

					<tr>
						<td style="padding: 6px 12px 6px 0;"><strong>Payment Method:</strong></td>
						<td>${paymentMethod}</td>
					</tr>

					${
            bkashTrxId
              ? `
								<tr>
									<td style="padding: 6px 12px 6px 0;"><strong>bKash Transaction ID:</strong></td>
									<td>${bkashTrxId}</td>
								</tr>
							`
              : ''
          }
				</table>

				<p>
					You can also access your invoice using the link below:
				</p>

				<p>
					<a href="${invoiceUrl}" target="_blank">
						View / Download Invoice
					</a>
				</p>

				<p>
					Thank you for using the University Management System.
				</p>

				<p>
					Regards,<br />
					University Management System
				</p>
			</div>
		`,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

export const PaymentEmailService = {
  sendPaymentSuccessEmail,
};
