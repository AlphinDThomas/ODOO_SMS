import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env');
}

/**
 * Browser client uses only the publishable key.
 * Never add VITE_SUPABASE_SECRET_KEY or DATABASE_URL here.
 * User access tokens are stored by supabase-js in local storage and sent to the API.
 */
export const supabase = createClient(url, publishableKey);
