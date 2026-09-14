import { Router } from 'express';

import { AuthController } from './auth.controller.ts';

const router = Router();

// RegisterUser
router.post('/register', AuthController.registerUser);

export const AuthRoutes = router;
