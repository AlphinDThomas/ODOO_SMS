import { z } from 'zod';

const billingIntervalEnum = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']);

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    amount: z.coerce.number().min(0),
    interval: billingIntervalEnum,
    minQuantity: z.coerce.number().int().min(1).optional(),
    availableFrom: z.string().date(),
    availableTo: z.string().date().optional().nullable(),
    autoCloseOnEnd: z.boolean().optional(),
    allowEarlyClose: z.boolean().optional(),
    allowPause: z.boolean().optional(),
    allowRenewal: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updatePlanSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    amount: z.coerce.number().min(0).optional(),
    interval: billingIntervalEnum.optional(),
    minQuantity: z.coerce.number().int().min(1).optional(),
    availableFrom: z.string().date().optional(),
    availableTo: z.string().date().optional().nullable(),
    autoCloseOnEnd: z.boolean().optional(),
    allowEarlyClose: z.boolean().optional(),
    allowPause: z.boolean().optional(),
    allowRenewal: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const planParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listPlansSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    interval: billingIntervalEnum.optional(),
    isActive: z
      .string()
      .transform((v) => v === 'true')
      .optional(),
    search: z.string().max(200).optional(),
  }),
});
