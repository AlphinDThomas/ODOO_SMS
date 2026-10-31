import { z } from 'zod';

const cleanString = (max) =>
  z
    .string()
    .max(max)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null));

export const createCustomerSchema = z.object({
  body: z.object({
    companyName: z.string().min(1, 'Company name is required').max(200).transform((v) => v.trim()),
    billingEmail: z.string().email('Valid billing email is required').transform((v) => v.toLowerCase().trim()),
    phone: cleanString(50),
    addressLine1: cleanString(200),
    addressLine2: cleanString(200),
    city: cleanString(100),
    state: cleanString(100),
    postalCode: cleanString(20),
    country: cleanString(100),
    userId: z
      .union([z.string().uuid('Invalid user UUID'), z.literal('')])
      .optional()
      .nullable()
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer UUID'),
  }),
  body: z.object({
    companyName: z.string().min(1).max(200).optional().transform((v) => v?.trim()),
    billingEmail: z.string().email().optional().transform((v) => v?.toLowerCase().trim()),
    phone: cleanString(50),
    addressLine1: cleanString(200),
    addressLine2: cleanString(200),
    city: cleanString(100),
    state: cleanString(100),
    postalCode: cleanString(20),
    country: cleanString(100),
    userId: z
      .union([z.string().uuid('Invalid user UUID'), z.literal('')])
      .optional()
      .nullable()
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  }),
});

export const customerIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer UUID'),
  }),
});

export const listCustomersQuerySchema = z.object({
  query: z.object({
    search: z.string().optional().transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
