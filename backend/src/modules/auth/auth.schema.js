import { z } from 'zod';
import { PASSWORD_RULE, isValidPassword } from '../../utils/password.js';

const password = z.string().refine(isValidPassword, { message: PASSWORD_RULE });

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password,
    fullName: z.string().min(1).max(120),
    companyName: z.string().min(1).max(160),
  }),
});

export const createStaffSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password,
    fullName: z.string().min(1).max(120),
  }),
});

export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
