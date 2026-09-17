import dotenv from 'dotenv';
import path from 'path';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  client_url: process.env.CLIENT_URL!,
  database_url: process.env.DATABASE_URL,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_access_expires_in: process.env
    .JWT_ACCESS_EXPIRES_IN! as SignOptions['expiresIn'],
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_refresh_expires_in: process.env
    .JWT_REFRESH_EXPIRES_IN! as SignOptions['expiresIn'],
  google_client_id: process.env.GOOGLE_CLIENT_ID!,
  redis_user: process.env.REDIS_USER!,
  redis_password: process.env.REDIS_PASSWORD!,
  redis_host: process.env.REDIS_HOST!,
  redis_port: process.env.REDIS_PORT!,
  smtp_user: process.env.SMTP_USER!,
  smtp_password: process.env.SMTP_PASSWORD!,
};
