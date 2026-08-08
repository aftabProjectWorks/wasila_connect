import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // In many serverless environments, server-only code shouldn't access NEXT_PUBLIC_ vars,
  // but for dev we keep this simple.
}

export const supabaseBrowser = {
  createClient: () => createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || ''),
};

// Service role client for server-side operations (requires SUPABASE_SERVICE_ROLE_KEY)
export function createServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
