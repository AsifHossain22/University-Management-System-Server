import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import httpStatus from 'http-status';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Welcome to University Management System Server!',
    data: null,
  });
});

export default app;
