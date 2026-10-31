import { z } from 'zod';

const templateLineSchema = z.object({
  productId: z.string().uuid('Invalid product UUID'),
  variantId: z.string().uuid('Invalid variant UUID').optional().nullable(),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().nonnegative('Unit price cannot be negative'),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Template name is required').max(200),
    planId: z.string().uuid('Invalid plan UUID'),
    validityDays: z.coerce.number().int().positive('Validity days must be greater than 0').default(30),
    lines: z.array(templateLineSchema).min(1, 'At least one product line is required'),
  }),
});

export const updateTemplateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid template UUID'),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    planId: z.string().uuid().optional(),
    validityDays: z.coerce.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    lines: z.array(templateLineSchema).min(1).optional(),
  }),
});

export const templateIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid template UUID'),
  }),
});

export const listTemplatesQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    planId: z.string().uuid().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
