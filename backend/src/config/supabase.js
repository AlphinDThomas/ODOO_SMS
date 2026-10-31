import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Credential roles:
 * - SUPABASE_URL: project URL (also used on the frontend).
 * - SUPABASE_PUBLISHABLE_KEY: public anon/publishable key. Used here only to
 *   call Auth getUser(accessToken). It is NOT a JWT signing secret.
 * - SUPABASE_SECRET_KEY: server-only service key for Admin Auth APIs
 *   (create staff). Never sent to the browser. Never used to HMAC-verify JWTs.
 * - DATABASE_URL: Prisma only.
 * - Access token: per-user JWT from the Authorization header.
 */
export const authClient = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const adminAuthClient = createClient(env.supabaseUrl, env.supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function getUserFromAccessToken(accessToken) {
  const { data, error } = await authClient.auth.getUser(accessToken);
  if (error || !data?.user) {
    return null;
  }
  return data.user;
}
