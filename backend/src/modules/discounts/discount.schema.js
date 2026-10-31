import { z } from 'zod';

const discountTypeEnum = z.enum(['FIXED', 'PERCENTAGE']);
const discountScopeEnum = z.enum(['PRODUCT', 'SUBSCRIPTION']);

export const createDiscountSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(200),
      type: discountTypeEnum,
      value: z.coerce.number().min(0),
      minPurchaseAmount: z.coerce.number().min(0).optional().nullable(),
      minQuantity: z.coerce.number().int().min(1).optional().nullable(),
      validFrom: z.string().date(),
      validTo: z.string().date().optional().nullable(),
      maxUses: z.coerce.number().int().min(1).optional().nullable(),
      scope: discountScopeEnum,
      isActive: z.boolean().optional(),
      productIds: z.array(z.string().uuid()).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type === 'PERCENTAGE' && data.value > 100) {
        ctx.addIssue({ code: 'too_big', maximum: 100, path: ['value'], message: 'Percentage cannot exceed 100' });
      }
      if (data.scope === 'PRODUCT' && (!data.productIds || data.productIds.length === 0)) {
        ctx.addIssue({ code: 'custom', path: ['productIds'], message: 'productIds required for PRODUCT scope' });
      }
    }),
});

export const updateDiscountSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    type: discountTypeEnum.optional(),
    value: z.coerce.number().min(0).optional(),
    minPurchaseAmount: z.coerce.number().min(0).optional().nullable(),
    minQuantity: z.coerce.number().int().min(1).optional().nullable(),
    validFrom: z.string().date().optional(),
    validTo: z.string().date().optional().nullable(),
    maxUses: z.coerce.number().int().min(1).optional().nullable(),
    scope: discountScopeEnum.optional(),
    isActive: z.boolean().optional(),
    productIds: z.array(z.string().uuid()).optional(),
  }),
});

export const discountParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listDiscountsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    isActive: z
      .string()
      .transform((v) => v === 'true')
      .optional(),
    scope: discountScopeEnum.optional(),
  }),
});
