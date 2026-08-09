import { createServiceSupabase } from '@/lib/supabaseClient';
import { createOrGetMemberFromAuth } from './auth';

export async function getUserFromAccessToken(accessToken: string | null | undefined) {
  if (!accessToken) return null;
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.auth.getUser(accessToken as string);
  if (error) return null;
  const user = data?.data?.user || data?.user;
  return user || null;
}

export async function getMemberFromAccessToken(accessToken: string | null | undefined) {
  const user = await getUserFromAccessToken(accessToken);
  if (!user) return null;
  // createOrGetMemberFromAuth will return existing or insert new
  const member = await createOrGetMemberFromAuth({ id: user.id, email: user.email, user_metadata: (user as any).user_metadata });
  return member || null;
}
