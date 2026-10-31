import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as billingController from './billing.controller.js';
import * as billingSchema from './billing.schema.js';

export const billingRouter = Router();

billingRouter.use(requireAuth);
billingRouter.use(requireRole('ADMIN', 'STAFF'));

billingRouter.post(
  '/run',
  validate(billingSchema.runBillingSchema),
  billingController.runBilling,
);

billingRouter.get(
  '/history',
  billingController.getBillingHistory,
);
