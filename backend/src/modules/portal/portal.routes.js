import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as controller from './portal.controller.js';

export const portalRouter = Router();

// All portal routes require an authenticated user
portalRouter.use(requireAuth);

// Customer Subscriptions
portalRouter.get('/subscriptions', controller.getSubscriptions);

// Customer Quotation Acceptance
portalRouter.post('/quotations/:id/accept', controller.acceptQuotation);

// Customer Invoices & Receipts
portalRouter.get('/invoices', controller.getInvoices);

