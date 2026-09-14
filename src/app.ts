import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import httpStatus from 'http-status';

import { AuthRoutes } from './app/modules/auth/auth.route.ts';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// AuthRoutes
app.use('/api/v1/auth', AuthRoutes);

app.get('/', (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Welcome to University Management System Server!',
    data: null,
  });
});

export default app;
