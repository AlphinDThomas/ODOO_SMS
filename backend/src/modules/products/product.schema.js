import { z } from 'zod';

const productTypeEnum = z.enum(['SOFTWARE', 'ADDON', 'OTHER']);

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    type: productTypeEnum,
    salesPrice: z.coerce.number().min(0),
    costPrice: z.coerce.number().min(0),
    notes: z.string().max(1000).optional().nullable(),
    isActive: z.boolean().optional(),
    taxRuleIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    type: productTypeEnum.optional(),
    salesPrice: z.coerce.number().min(0).optional(),
    costPrice: z.coerce.number().min(0).optional(),
    notes: z.string().max(1000).optional().nullable(),
    isActive: z.boolean().optional(),
    taxRuleIds: z.array(z.string().uuid()).optional(),
  }),
});

export const getProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    type: productTypeEnum.optional(),
    isActive: z
      .string()
      .transform((v) => v === 'true')
      .optional(),
    search: z.string().max(200).optional(),
  }),
});

export const createVariantSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200),
    priceAdjustment: z.coerce.number(),
    isActive: z.boolean().optional(),
  }),
});

export const updateVariantSchema = z.object({
  params: z.object({ id: z.string().uuid(), variantId: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    priceAdjustment: z.coerce.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const variantParamsSchema = z.object({
  params: z.object({ id: z.string().uuid(), variantId: z.string().uuid() }),
});
