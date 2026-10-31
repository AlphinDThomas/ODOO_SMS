import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid(),
    method: z.enum(['BANK_TRANSFER', 'CARD', 'CASH', 'UPI', 'OTHER']),
    amount: z.coerce.number().positive('Payment amount must be greater than zero'),
    paidAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    note: z.string().max(500).optional(),
  }),
});

export const listPaymentsQuerySchema = z.object({
  query: z.object({
    invoiceId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
