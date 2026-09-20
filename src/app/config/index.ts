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

  super_admin_name: process.env.SUPER_ADMIN_NAME!,
  super_admin_email: process.env.SUPER_ADMIN_EMAIL!,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD!,

  redis_user: process.env.REDIS_USER!,
  redis_password: process.env.REDIS_PASSWORD!,
  redis_host: process.env.REDIS_HOST!,
  redis_port: process.env.REDIS_PORT!,

  smtp_user: process.env.SMTP_USER!,
  smtp_password: process.env.SMTP_PASSWORD!,

  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY!,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET!,
};
