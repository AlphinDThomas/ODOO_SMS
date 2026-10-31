import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './plan.controller.js';
import { createPlanSchema, listPlansSchema, planParamsSchema, updatePlanSchema } from './plan.schema.js';

export const plansRouter = Router();

plansRouter.get('/', requireAuth, validate(listPlansSchema), controller.list);
plansRouter.get('/:id', requireAuth, validate(planParamsSchema), controller.get);
plansRouter.post('/', requireAuth, requireRole('ADMIN'), validate(createPlanSchema), controller.create);
plansRouter.patch('/:id', requireAuth, requireRole('ADMIN'), validate(updatePlanSchema), controller.update);
plansRouter.delete('/:id', requireAuth, requireRole('ADMIN'), validate(planParamsSchema), controller.remove);
