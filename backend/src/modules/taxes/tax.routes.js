import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './tax.controller.js';
import { createTaxRuleSchema, listTaxRulesSchema, taxRuleParamsSchema, updateTaxRuleSchema } from './tax.schema.js';

export const taxRulesRouter = Router();

taxRulesRouter.get('/', requireAuth, validate(listTaxRulesSchema), controller.list);
taxRulesRouter.get('/:id', requireAuth, validate(taxRuleParamsSchema), controller.get);
taxRulesRouter.post('/', requireAuth, requireRole('ADMIN'), validate(createTaxRuleSchema), controller.create);
taxRulesRouter.patch('/:id', requireAuth, requireRole('ADMIN'), validate(updateTaxRuleSchema), controller.update);
taxRulesRouter.delete('/:id', requireAuth, requireRole('ADMIN'), validate(taxRuleParamsSchema), controller.remove);
