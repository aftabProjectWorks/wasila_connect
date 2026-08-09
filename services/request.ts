import type { NextRequest } from 'next/server';
import { getMemberFromAccessToken } from './session';

/**
 * Extract actor member id from a NextRequest.
 * Tries Authorization: Bearer <token>, Supabase access token cookie, or other header.
 */
export async function getActorFromRequest(req: NextRequest): Promise<string | null> {
  // Authorization header
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length).trim();
  }

  // Supabase client may set cookies like 'sb:token' or 'sb-access-token' or 'supabase-auth-token'. Try common ones.
  if (!token) {
    const cookie = req.cookies.get('sb-access-token') || req.cookies.get('supabase-access-token') || req.cookies.get('sb:token');
    if (cookie) token = cookie.value;
  }

  if (!token) return null;

  const member = await getMemberFromAccessToken(token);
  if (!member) return null;
  return member.id;
}
