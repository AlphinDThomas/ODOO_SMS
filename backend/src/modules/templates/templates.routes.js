import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './templates.controller.js';
import {
  createTemplateSchema,
  listTemplatesQuerySchema,
  templateIdParamSchema,
  updateTemplateSchema,
} from './templates.schema.js';

export const templatesRouter = Router();

templatesRouter.get(
  '/',
  requireAuth,
  validate(listTemplatesQuerySchema),
  controller.listTemplates,
);

templatesRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(createTemplateSchema),
  controller.createTemplate,
);

templatesRouter.get(
  '/:id',
  requireAuth,
  validate(templateIdParamSchema),
  controller.getTemplate,
);

templatesRouter.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(updateTemplateSchema),
  controller.updateTemplate,
);

templatesRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(templateIdParamSchema),
  controller.deleteTemplate,
);
