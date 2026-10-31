import { z } from 'zod';

const subscriptionLineInputSchema = z.object({
  productId: z.string().uuid('Invalid product UUID'),
  variantId: z.string().uuid('Invalid variant UUID').optional().nullable(),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().nonnegative('Unit price cannot be negative'),
  taxRatePercent: z.coerce.number().nonnegative('Tax rate cannot be negative').optional().default(0),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const createSubscriptionSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid customer UUID'),
    planId: z.string().uuid('Invalid plan UUID'),
    templateId: z.string().uuid('Invalid template UUID').optional().nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Start date must be YYYY-MM-DD').optional(),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Expiry date must be YYYY-MM-DD').optional(),
    billingInterval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    paymentTermsDays: z.coerce.number().int().positive().optional().default(15),
    quotationValidityDays: z.coerce.number().int().positive().optional().default(30),
    lines: z.array(subscriptionLineInputSchema).optional(),
    discountIds: z.array(z.string().uuid()).optional().default([]),
  }),
});

export const updateSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid subscription UUID'),
  }),
  body: z.object({
    customerId: z.string().uuid().optional(),
    planId: z.string().uuid().optional(),
    templateId: z.string().uuid().optional().nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
    billingInterval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    paymentTermsDays: z.coerce.number().int().positive().optional(),
    quotationValidityDays: z.coerce.number().int().positive().optional(),
    lines: z.array(subscriptionLineInputSchema).min(1).optional(),
    discountIds: z.array(z.string().uuid()).optional(),
  }),
});

export const subscriptionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid subscription UUID'),
  }),
});

export const listSubscriptionsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'CLOSED']).optional(),
    customerId: z.string().uuid().optional(),
    planId: z.string().uuid().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const pauseSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid subscription UUID'),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }).optional(),
});

export const closeSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid subscription UUID'),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }).optional(),
});

export const renewSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid subscription UUID'),
  }),
  body: z.object({
    newExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'New expiry date must be YYYY-MM-DD').optional(),
  }).optional(),
});
