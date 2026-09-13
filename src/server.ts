import 'dotenv/config';
import app from './app.js';
import { prisma } from './lib/prisma.js';

const PORT = Number(process.env.PORT) || 5000;

const main = async () => {
  try {
    await prisma.$connect();

    console.log('Database connected successfully');

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
