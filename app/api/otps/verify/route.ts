import { createServiceSupabase } from '../../lib/supabaseClient';

export async function POST(request: Request) {
  const supabase = createServiceSupabase();
  const body = await request.json().catch(() => ({}));
  const { code, purpose = 'chain_transfer' } = body;
  if (!code) return new Response(JSON.stringify({ error: 'code required' }), { status: 400 });

  const now = new Date().toISOString();

  // Atomic verify-and-set: update the row where code matches, not used, and not expired
  const { data, error } = await supabase
    .from('otps')
    .update({ used: true })
    .eq('code', code)
    .eq('purpose', purpose)
    .eq('used', false)
    .gt('expires_at', now)
    .select()
    .maybeSingle();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!data) return new Response(JSON.stringify({ error: 'not found or already used or expired' }), { status: 404 });

  return new Response(JSON.stringify({ success: true, otp: { id: data.id, issued_to: data.issued_to, used: data.used } }), { status: 200 });
}
