import { createServiceSupabase } from '../lib/supabaseClient';

export async function getMemberById(memberId: string) {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('members').select('*').eq('id', memberId).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMemberBySupabaseId(supabaseUserId: string) {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('members').select('*').eq('supabase_user_id', supabaseUserId).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}
