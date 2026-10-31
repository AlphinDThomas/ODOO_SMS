import { z } from 'zod';

export const listInvoicesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['ALL', 'DRAFT', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE']).optional(),
    search: z.string().trim().optional(),
    customerId: z.string().uuid().optional(),
    subscriptionId: z.string().uuid().optional(),
  }),
});

export const invoiceIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
