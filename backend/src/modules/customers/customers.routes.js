import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './customers.controller.js';
import {
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from './customers.schema.js';

export const customersRouter = Router();

customersRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(listCustomersQuerySchema),
  controller.listCustomers,
);

customersRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(createCustomerSchema),
  controller.createCustomer,
);

customersRouter.get(
  '/:id',
  requireAuth,
  validate(customerIdParamSchema),
  controller.getCustomer,
);

customersRouter.put(
  '/:id',
  requireAuth,
  validate(updateCustomerSchema),
  controller.updateCustomer,
);
