import { OAuth2Client } from 'google-auth-library';
import httpStatus from 'http-status';
import config from '../config/index.ts';
import { AppError } from './AppError.ts';

const googleClient = new OAuth2Client(config.google_client_id);

const verifyGoogleIdToken = async (idToken: string) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google_client_id,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid Google ID token.');
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid Google ID token.');
  }
};

export const googleUtils = {
  verifyGoogleIdToken,
};
