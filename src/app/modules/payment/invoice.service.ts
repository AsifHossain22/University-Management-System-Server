import PDFDocument from 'pdfkit';
import { cloudinary } from '../../../lib/cloudinary.ts';

export interface IGeneratePaymentInvoicePayload {
  invoiceNumber: string;
  paymentDate: Date;

  student: {
    studentId: string;
    name: string;
    email: string;
  };

  fee: {
    title: string;
    description?: string | null;
  };

  payment: {
    amount: number;
    currency: string;
    paymentMethod: string;
    bkashTrxId?: string | null;
    bkashPaymentId?: string | null;
  };
}

interface IUploadedInvoice {
  secureUrl: string;
  publicId: string;
  pdfBuffer: Buffer;
}

// Generate a unique university invoice number.
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `INV-${year}${month}${day}-${crypto.randomUUID()}`;
};

// Generate payment invoice PDF.
const generatePaymentInvoice = async (
  payload: IGeneratePaymentInvoicePayload,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      // --------------------------------------------------
      // Header
      // --------------------------------------------------

      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('UNIVERSITY MANAGEMENT SYSTEM', {
          align: 'center',
        });

      doc
        .moveDown(0.5)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('PAYMENT INVOICE', {
          align: 'center',
        });

      doc.moveDown(1);

      // --------------------------------------------------
      // Invoice information
      // --------------------------------------------------

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Invoice Number: ${payload.invoiceNumber}`);

      doc.text(
        `Payment Date: ${payload.paymentDate.toLocaleDateString('en-GB')}`,
      );

      doc.moveDown(1);

      // --------------------------------------------------
      // Student information
      // --------------------------------------------------

      doc.fontSize(12).font('Helvetica-Bold').text('STUDENT INFORMATION');

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Student ID: ${payload.student.studentId}`);

      doc.text(`Name: ${payload.student.name}`);
      doc.text(`Email: ${payload.student.email}`);

      doc.moveDown(1);

      // --------------------------------------------------
      // Fee information
      // --------------------------------------------------

      doc.fontSize(12).font('Helvetica-Bold').text('FEE INFORMATION');

      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica').text(`Fee: ${payload.fee.title}`);

      if (payload.fee.description) {
        doc.text(`Description: ${payload.fee.description}`);
      }

      doc.moveDown(1);

      // --------------------------------------------------
      // Payment information
      // --------------------------------------------------

      doc.fontSize(12).font('Helvetica-Bold').text('PAYMENT INFORMATION');

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          `Amount: ${payload.payment.currency} ${payload.payment.amount.toFixed(
            2,
          )}`,
        );

      doc.text(`Payment Method: ${payload.payment.paymentMethod}`);
      doc.text('Payment Status: PAID');

      if (payload.payment.bkashTrxId) {
        doc.text(`bKash Transaction ID: ${payload.payment.bkashTrxId}`);
      }

      if (payload.payment.bkashPaymentId) {
        doc.text(`bKash Payment ID: ${payload.payment.bkashPaymentId}`);
      }

      doc.moveDown(2);

      // --------------------------------------------------
      // Total
      // --------------------------------------------------

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(
          `Total Paid: ${payload.payment.currency} ${payload.payment.amount.toFixed(
            2,
          )}`,
          {
            align: 'right',
          },
        );

      doc.moveDown(3);

      // --------------------------------------------------
      // Footer
      // --------------------------------------------------

      doc
        .fontSize(9)
        .font('Helvetica')
        .text('This is a computer-generated payment invoice.', {
          align: 'center',
        });

      doc.text('Thank you.', {
        align: 'center',
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Upload generated invoice PDF to Cloudinary.
const uploadInvoiceToCloudinary = (
  buffer: Buffer,
  invoiceNumber: string,
): Promise<IUploadedInvoice> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'university-management/invoices',
        public_id: invoiceNumber,
        resource_type: 'raw',
        format: 'pdf',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url || !result.public_id) {
          reject(
            new Error(
              'Cloudinary did not return the required invoice information!',
            ),
          );
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          pdfBuffer: buffer,
        });
      },
    );

    uploadStream.end(buffer);
  });
};

// Delete invoice from Cloudinary if database finalization fails.
const deleteInvoiceFromCloudinary = async (publicId: string) => {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'raw',
  });
};

// Generate PDF and upload it to Cloudinary.
const createPaymentInvoice = async (
  payload: IGeneratePaymentInvoicePayload,
): Promise<IUploadedInvoice> => {
  const pdfBuffer = await generatePaymentInvoice(payload);

  const uploadedInvoice = await uploadInvoiceToCloudinary(
    pdfBuffer,
    payload.invoiceNumber,
  );

  return {
    ...uploadedInvoice,
    pdfBuffer,
  };
};

export const InvoiceService = {
  generateInvoiceNumber,
  generatePaymentInvoice,
  uploadInvoiceToCloudinary,
  deleteInvoiceFromCloudinary,
  createPaymentInvoice,
};
