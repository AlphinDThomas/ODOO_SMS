import { PrismaClient } from '@prisma/client';

/**
 * Privileged database client. This connection bypasses any Supabase RLS.
 * Authorization must be enforced in services (role checks + ownership filters)
 * before every query. Never pass client-supplied IDs through without checks.
 */
export const prisma = new PrismaClient();
