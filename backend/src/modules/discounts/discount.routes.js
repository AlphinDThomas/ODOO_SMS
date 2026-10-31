import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './discount.controller.js';
import {
  createDiscountSchema,
  discountParamsSchema,
  listDiscountsSchema,
  updateDiscountSchema,
} from './discount.schema.js';

export const discountsRouter = Router();

discountsRouter.get('/', requireAuth, validate(listDiscountsSchema), controller.list);
discountsRouter.get('/:id', requireAuth, validate(discountParamsSchema), controller.get);
discountsRouter.post('/', requireAuth, requireRole('ADMIN'), validate(createDiscountSchema), controller.create);
discountsRouter.patch('/:id', requireAuth, requireRole('ADMIN'), validate(updateDiscountSchema), controller.update);
discountsRouter.delete('/:id', requireAuth, requireRole('ADMIN'), validate(discountParamsSchema), controller.remove);
