import { createServiceSupabase } from '../supabaseClient';

export function createServiceRoleClient() {
  return createServiceSupabase();
}

export default createServiceRoleClient;
