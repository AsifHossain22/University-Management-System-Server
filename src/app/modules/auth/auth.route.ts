import { Router } from 'express';

import { AuthController } from './auth.controller.ts';

const router = Router();

// RegisterUser
router.post('/register', AuthController.registerUser);

// LogInUser
router.post('/login', AuthController.loginUser);

export const AuthRoutes = router;
