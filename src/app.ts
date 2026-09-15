import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import httpStatus from 'http-status';
import { AuthRoutes } from './app/modules/auth/auth.route.ts';
import { notFound } from './app/middlewares/notFound.ts';
import { globalErrorHandler } from './app/utils/globalErrorHandler.ts';

const app: Application = express();

// ParseURLEncodedFormData
app.use(express.urlencoded({ extended: true }));

// ParseJSONRequestBodies
app.use(express.json());

// AuthRoutes
app.use('/api/v1/auth', AuthRoutes);

// WelcomeRoute
app.get('/', (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Welcome to University Management System Server!',
    data: null,
  });
});

// GlobalErrorHandler
app.use(globalErrorHandler);

// NotFound
app.use(notFound);

export default app;
