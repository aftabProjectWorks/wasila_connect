import { createServiceSupabase } from '../lib/supabaseClient';

export async function handler(req: Request) {
  const supabase = createServiceSupabase();
  // Very small health check: ensure we can make a lightweight call using service role
  const { data, error } = await supabase.from('members').select('id').limit(1).maybeSingle();
  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }));
}
