import { createServiceSupabase } from '@/lib/supabaseClient';

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

export async function createOrGetMemberFromAuth(supabaseUser: AuthUser) {
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
  try {
    const supabase = createServiceSupabase();
    const { data: userData, error } = await supabase.auth.getUser(accessToken);
    if (error) return false;
    
    // Handle both response formats
    const user = userData?.user || (userData as any)?.data?.user;
    if (!user) return false;
    
    const member = await getMemberBySupabaseId(user.id);
    return member?.role === 'admin';
  } catch {
    return false;
  }
}

export async function isMemberAdmin(memberId: string) {
  const db = createServiceSupabase();
  const { data, error } = await db.from('members').select('role').eq('id', memberId).limit(1).maybeSingle();
  if (error) throw error;
  return data?.role === 'admin';
}

const authService = { createOrGetMemberFromAuth, getMemberBySupabaseId, getMemberById, isAdminFromAccessToken, isMemberAdmin };
export default authService;
