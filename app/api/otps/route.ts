import { createServiceSupabase } from '../../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  // Create an OTP for the next person in chain
  const supabase = createServiceSupabase();
  const body = await request.json().catch(() => ({}));
  const { issued_by_member_id, issued_to_member_id, purpose = 'chain_transfer', ttl_seconds = 300 } = body;
  if (!issued_by_member_id) {
    return new Response(JSON.stringify({ error: 'issued_by_member_id required' }), { status: 400 });
  }
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + ttl_seconds * 1000).toISOString();
  const { data, error } = await supabase.from('otps').insert([{ code, purpose, issued_to: issued_to_member_id || null, issued_by: issued_by_member_id, expires_at: expiresAt }]).select().maybeSingle();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ otp: data }), { status: 200 });
}
