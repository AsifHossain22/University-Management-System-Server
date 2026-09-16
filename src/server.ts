import 'dotenv/config';
import app from './app.ts';
import { prisma } from './lib/prisma.ts';
import { redisClient } from './lib/redis.ts';

const PORT = Number(process.env.PORT) || 5000;

const main = async () => {
  try {
    // ConnectDatabase
    await prisma.$connect();
    console.log('Database connected successfully!');

    // ConnectRedis
    await redisClient.connect();
    console.log('Redis connected successfully!');

    app.listen(PORT, () => {
      console.log(
        `University Management System Server is running on port ${PORT}`,
      );
    });
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
};

main();
