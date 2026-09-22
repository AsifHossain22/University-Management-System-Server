import httpStatus from 'http-status';
import config from '../app/config/index.ts';
import { AppError } from '../app/utils/AppError.ts';
import { redisClient } from './redis.ts';

const BKASH_ID_TOKEN_KEY = 'bkash:idToken';
const BKASH_REFRESH_TOKEN_KEY = 'bkash:refreshToken';

const ID_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 28; // 28 days
const TOKEN_REFRESH_BUFFER_SECONDS = 600; // 10 minutes

interface IBkashTokenResponse {
  id_token: string;
  refresh_token: string;
}

interface IBkashCreatePaymentRequest {
  mode: '0011';
  payerReference: string;
  callbackURL: string;
  amount: string;
  currency: 'BDT';
  intent: 'sale';
  merchantInvoiceNumber: string;
}

interface IBkashCreatePaymentResponse {
  paymentID: string;
  bkashURL: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  merchantInvoiceNumber: string;
}

interface IBkashExecutePaymentResponse {
  paymentID: string;
  trxID?: string;
  transactionStatus: string;
  amount?: string;
  currency?: string;
  merchantInvoiceNumber?: string;
}

interface IBkashQueryPaymentResponse {
  paymentID: string;
  trxID?: string;
  transactionStatus: string;
  amount?: string;
  currency?: string;
  merchantInvoiceNumber?: string;
}

// GetBkashIdToken
const getBkashIdToken = async (): Promise<string> => {
  try {
    const cachedIdToken = await redisClient.get(BKASH_ID_TOKEN_KEY);

    const idTokenTTL = await redisClient.ttl(BKASH_ID_TOKEN_KEY);

    const cachedRefreshToken = await redisClient.get(BKASH_REFRESH_TOKEN_KEY);

    const refreshTokenTTL = await redisClient.ttl(BKASH_REFRESH_TOKEN_KEY);

    if (cachedIdToken && idTokenTTL > TOKEN_REFRESH_BUFFER_SECONDS) {
      return cachedIdToken;
    }

    if (cachedRefreshToken && refreshTokenTTL > TOKEN_REFRESH_BUFFER_SECONDS) {
      const response = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            username: config.bkash_username,
            password: config.bkash_password,
          },
          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: cachedRefreshToken,
          }),
        },
      );

      if (!response.ok) {
        throw new AppError(
          httpStatus.BAD_GATEWAY,
          'Failed to refresh bKash access token!',
        );
      }

      const result = (await response.json()) as Partial<IBkashTokenResponse>;

      if (!result.id_token) {
        throw new AppError(
          httpStatus.BAD_GATEWAY,
          'Invalid bKash token refresh response!',
        );
      }

      await redisClient.set(BKASH_ID_TOKEN_KEY, result.id_token, {
        expiration: {
          type: 'EX',
          value: ID_TOKEN_TTL_SECONDS,
        },
      });

      return result.id_token;
    }

    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          username: config.bkash_username,
          password: config.bkash_password,
        },
        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
        }),
      },
    );

    if (!response.ok) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'Failed to grant bKash access token!',
      );
    }

    const result = (await response.json()) as Partial<IBkashTokenResponse>;

    if (!result.id_token || !result.refresh_token) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'Invalid bKash token grant response!',
      );
    }

    await redisClient.set(BKASH_ID_TOKEN_KEY, result.id_token, {
      expiration: {
        type: 'EX',
        value: ID_TOKEN_TTL_SECONDS,
      },
    });

    await redisClient.set(BKASH_REFRESH_TOKEN_KEY, result.refresh_token, {
      expiration: {
        type: 'EX',
        value: REFRESH_TOKEN_TTL_SECONDS,
      },
    });

    return result.id_token;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.BAD_GATEWAY,
      'Unable to communicate with the bKash payment gateway!',
    );
  }
};

// CreatePayment
const createPayment = async (
  payload: IBkashCreatePaymentRequest,
): Promise<IBkashCreatePaymentResponse> => {
  try {
    const bkashIdToken = await getBkashIdToken();

    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: bkashIdToken,
          'X-App-Key': config.bkash_app_key,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'Failed to create bKash payment!',
      );
    }

    const result =
      (await response.json()) as Partial<IBkashCreatePaymentResponse>;

    if (!result.paymentID || !result.bkashURL) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'Invalid bKash payment creation response!',
      );
    }

    return result as IBkashCreatePaymentResponse;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.BAD_GATEWAY,
      'Unable to communicate with the bKash payment gateway!',
    );
  }
};

// ExecutePayment
const executePayment = async (
  paymentID: string,
): Promise<IBkashExecutePaymentResponse> => {
  try {
    const bkashIdToken = await getBkashIdToken();

    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/execute`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: bkashIdToken,
          'X-App-Key': config.bkash_app_key,
        },
        body: JSON.stringify({
          paymentID,
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();

      console.error('bKash execute payment failed:', {
        status: response.status,
        body: errorBody,
      });

      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'Failed to execute bKash payment!',
      );
    }

    const result =
      (await response.json()) as Partial<IBkashExecutePaymentResponse>;

    console.log('bKash execute payment response:', result);

    if (!result.paymentID || !result.transactionStatus) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'Invalid bKash payment execution response!',
      );
    }

    return result as IBkashExecutePaymentResponse;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.BAD_GATEWAY,
      'Unable to communicate with the bKash payment gateway!',
    );
  }
};

// QueryPayment
const queryPayment = async (
  paymentID: string,
): Promise<IBkashQueryPaymentResponse> => {
  try {
    const bkashIdToken = await getBkashIdToken();

    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/payment/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: bkashIdToken,
          'X-App-Key': config.bkash_app_key,
        },
        body: JSON.stringify({
          paymentID,
        }),
      },
    );

    // ResponseBody
    const responseBody = await response.text();

    let result: Partial<IBkashQueryPaymentResponse>;

    try {
      result = JSON.parse(responseBody) as Partial<IBkashQueryPaymentResponse>;
    } catch {
      console.error('bKash query payment returned non-JSON response:', {
        status: response.status,
        body: responseBody,
      });

      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'Invalid response received from bKash payment status API!',
      );
    }

    console.log('bKash query payment response:', result);

    if (!response.ok) {
      console.error('bKash query payment failed:', {
        status: response.status,
        body: result,
      });

      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'Failed to query bKash payment status!',
      );
    }

    if (!result.paymentID || !result.transactionStatus) {
      console.error('Unexpected bKash query payment response:', result);

      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'Invalid bKash payment status response!',
      );
    }

    return result as IBkashQueryPaymentResponse;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.BAD_GATEWAY,
      'Unable to communicate with the bKash payment gateway!',
    );
  }
};

export const bkashUtils = {
  getBkashIdToken,
  createPayment,
  executePayment,
  queryPayment,
};
