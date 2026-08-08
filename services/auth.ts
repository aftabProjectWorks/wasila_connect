import { createServiceSupabase } from '../lib/supabaseClient';

export async function createOrGetMemberFromAuth(supabaseUser: { id: string; email?: string; user_metadata?: any }) {
  // supabaseUser.id is the auth.uid()
  const supabase = createServiceSupabase();

  const { data, error } = await supabase.from('members').select('*').eq('supabase_user_id', supabaseUser.id).limit(1).maybeSingle();
  if (error) throw error;
  if (data) return data;

  const newMember = {
    email: supabaseUser.email || null,
    full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
    supabase_user_id: supabaseUser.id,
    role: 'member',
  };
  const { data: inserted, error: insertErr } = await createServiceSupabase().from('members').insert([newMember]).select().maybeSingle();
  if (insertErr) throw insertErr;
  return inserted;
}
