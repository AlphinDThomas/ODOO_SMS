import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as paymentsController from './payments.controller.js';
import * as paymentsSchema from './payments.schema.js';

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

// Record payment (Admin and Staff only)
paymentsRouter.post(
  '/',
  requireRole('ADMIN', 'STAFF'),
  validate(paymentsSchema.createPaymentSchema),
  paymentsController.recordPayment,
);

// List payments
paymentsRouter.get(
  '/',
  validate(paymentsSchema.listPaymentsQuerySchema),
  paymentsController.listPayments,
);
