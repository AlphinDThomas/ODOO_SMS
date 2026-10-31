import { z } from 'zod';

export const runBillingSchema = z.object({
  body: z.object({
    asOfDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    subscriptionId: z.string().uuid().optional(),
  }),
});
