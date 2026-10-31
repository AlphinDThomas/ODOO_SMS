import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as invoicesController from './invoices.controller.js';
import * as invoicesSchema from './invoices.schema.js';

export const invoicesRouter = Router();

invoicesRouter.use(requireAuth);

// All authenticated roles can list/view their invoices (service scopes by customer)
invoicesRouter.get(
  '/',
  validate(invoicesSchema.listInvoicesQuerySchema),
  invoicesController.listInvoices,
);

invoicesRouter.get(
  '/:id',
  validate(invoicesSchema.invoiceIdParamSchema),
  invoicesController.getInvoice,
);

// Staff and Admin can manage invoices
invoicesRouter.post(
  '/:id/confirm',
  requireRole('ADMIN', 'STAFF'),
  validate(invoicesSchema.invoiceIdParamSchema),
  invoicesController.confirmInvoice,
);

invoicesRouter.post(
  '/:id/cancel',
  requireRole('ADMIN', 'STAFF'),
  validate(invoicesSchema.invoiceIdParamSchema),
  invoicesController.cancelInvoice,
);

invoicesRouter.post(
  '/:id/send',
  requireRole('ADMIN', 'STAFF'),
  validate(invoicesSchema.invoiceIdParamSchema),
  invoicesController.sendInvoice,
);
