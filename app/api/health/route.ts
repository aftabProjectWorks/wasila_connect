import { createServiceSupabase } from '../../lib/supabaseClient';

export async function GET() {
  // Health check: if service role not configured, return lighter ok response
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return new Response(JSON.stringify({ ok: true, db: 'not-configured' }), { status: 200 });
  }

  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase.from('members').select('id').limit(1).maybeSingle();
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), { status: 500 });
  }
}
