import { z } from 'zod';

export const createTaxRuleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    ratePercent: z.coerce.number().min(0).max(100),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateTaxRuleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    ratePercent: z.coerce.number().min(0).max(100).optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const taxRuleParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listTaxRulesSchema = z.object({
  query: z.object({
    isActive: z
      .string()
      .transform((v) => v === 'true')
      .optional(),
  }),
});
