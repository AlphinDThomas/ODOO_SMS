import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './product.controller.js';
import {
  createProductSchema,
  createVariantSchema,
  getProductSchema,
  listProductsSchema,
  updateProductSchema,
  updateVariantSchema,
  variantParamsSchema,
} from './product.schema.js';

export const productsRouter = Router();

// All authenticated users can list and view products
productsRouter.get('/', requireAuth, validate(listProductsSchema), controller.list);
productsRouter.get('/:id', requireAuth, validate(getProductSchema), controller.get);

// Admin and Staff can create/update. Only Admin can soft-delete.
productsRouter.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), validate(createProductSchema), controller.create);
productsRouter.patch('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), validate(updateProductSchema), controller.update);
productsRouter.delete('/:id', requireAuth, requireRole('ADMIN'), validate(getProductSchema), controller.remove);

// Variants
productsRouter.get('/:id/variants', requireAuth, validate(getProductSchema), controller.listVariants);
productsRouter.post('/:id/variants', requireAuth, requireRole('ADMIN', 'STAFF'), validate(createVariantSchema), controller.createVariant);
productsRouter.patch('/:id/variants/:variantId', requireAuth, requireRole('ADMIN', 'STAFF'), validate(updateVariantSchema), controller.updateVariant);
productsRouter.delete('/:id/variants/:variantId', requireAuth, requireRole('ADMIN'), validate(variantParamsSchema), controller.removeVariant);
