import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './reports.controller.js';

export const reportsRouter = Router();

// Finance analytics are strictly restricted to ADMIN and STAFF
reportsRouter.use(requireAuth, requireRole('ADMIN', 'STAFF'));

// GET /api/v1/reports/finance
reportsRouter.get('/finance', controller.getFinanceReport);

