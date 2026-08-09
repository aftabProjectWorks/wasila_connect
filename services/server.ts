import { createServiceSupabase } from '../lib/supabaseClient';

// Services in /services/ import './server' so provide a simple wrapper here.
export function createServiceRoleClient() {
  // createServiceSupabase throws if env var missing
  return createServiceSupabase();
}

export default createServiceRoleClient;
