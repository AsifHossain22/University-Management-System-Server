import config from '../../config/index.ts';
import { transporter } from '../../../lib/nodemailer.ts';
import type { ContactMessageInput } from './contact.validation.ts';

const sendContactMessage = async (
  payload: ContactMessageInput,
): Promise<void> => {
  await transporter.sendMail({
    from: config.smtp_user,
    to: config.smtp_user,
    replyTo: {
      name: payload.name,
      address: payload.email,
    },
    subject: `[UMS Contact] ${payload.subject}`,
    text: [
      'A new message was submitted through the University Management System contact form.',
      '',
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Subject: ${payload.subject}`,
      '',
      'Message:',
      payload.message,
    ].join('\n'),
  });
};

export const ContactService = {
  sendContactMessage,
};
