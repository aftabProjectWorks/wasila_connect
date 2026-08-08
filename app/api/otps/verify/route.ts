import { createServiceSupabase } from '../../lib/supabaseClient';

export async function POST(request: Request) {
  const supabase = createServiceSupabase();
  const body = await request.json().catch(() => ({}));
  const { code, purpose = 'chain_transfer' } = body;
  if (!code) return new Response(JSON.stringify({ error: 'code required' }), { status: 400 });

  const now = new Date().toISOString();
  const { data, error } = await supabase.from('otps').select('*').eq('code', code).eq('purpose', purpose).limit(1).maybeSingle();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!data) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
  if (data.used) return new Response(JSON.stringify({ error: 'already used' }), { status: 400 });
  if (new Date(data.expires_at) < new Date(now)) return new Response(JSON.stringify({ error: 'expired' }), { status: 400 });

  const { error: updErr } = await supabase.from('otps').update({ used: true }).eq('id', data.id);
  if (updErr) return new Response(JSON.stringify({ error: updErr.message }), { status: 500 });
  return new Response(JSON.stringify({ success: true, otp: data }), { status: 200 });
}
