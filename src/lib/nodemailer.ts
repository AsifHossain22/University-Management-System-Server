import nodemailer from 'nodemailer';
import config from '../app/config/index.ts';

export const transporter = nodemailer.createTransport({
  host: '142.251.127.109',
  port: 465,
  secure: true,
  auth: {
    user: config.smtp_user,
    pass: config.smtp_password,
  },
  tls: {
    servername: 'smtp.gmail.com',
  },
});
