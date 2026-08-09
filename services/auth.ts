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

export async function getMemberBySupabaseId(supabaseUserId: string) {
  const db = createServiceSupabase();
  const { data, error } = await db.from('members').select('*').eq('supabase_user_id', supabaseUserId).limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getMemberById(memberId: string) {
  const db = createServiceSupabase();
  const { data, error } = await db.from('members').select('*').eq('id', memberId).limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function isAdminFromAccessToken(accessToken: string | null | undefined) {
  if (!accessToken) return false;
  const supabase = createServiceSupabase();
  const { data: userData, error } = await supabase.auth.getUser(accessToken);
  if (error) return false;
  const user = userData?.data?.user || userData?.user;
  if (!user) return false;
  const member = await getMemberBySupabaseId(user.id);
  return member?.role === 'admin';
}

export async function isMemberAdmin(memberId: string) {
  const db = createServiceSupabase();
  const { data, error } = await db.from('members').select('role').eq('id', memberId).limit(1).maybeSingle();
  if (error) throw error;
  return data?.role === 'admin';
}

export default { createOrGetMemberFromAuth, getMemberBySupabaseId, getMemberById, isAdminFromAccessToken, isMemberAdmin };
