import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import { createStaffSchema, listUsersQuerySchema, registerSchema } from './auth.schema.js';

export const authRouter = Router();
export const usersRouter = Router();

authRouter.post('/register', validate(registerSchema), controller.register);
authRouter.get('/me', requireAuth, controller.me);

usersRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate(listUsersQuerySchema),
  controller.listUsers,
);
usersRouter.post(
  '/staff',
  requireAuth,
  requireRole('ADMIN'),
  validate(createStaffSchema),
  controller.createStaff,
);
