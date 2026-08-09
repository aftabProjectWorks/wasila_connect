import { createServiceSupabase } from '../../../../lib/supabaseClient';
import { MockProvider } from '../../../../services/payments/mockProvider';

export async function POST(request: Request) {
  // Simple mock payment creation endpoint for development
  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount ?? 0);
  if (!amount || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 });
  }

  const provider = MockProvider;
  const intent = await provider.createPaymentIntent({ amount, currency: body.currency || 'INR', metadata: body.metadata || {} });

  // Create a transaction record using service role
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('transactions').insert([{ amount, currency: body.currency || 'INR', provider: 'mock', reference: intent.id, metadata: intent }]);
  if (error) {
    console.error('Failed to create transaction', error);
  }

  return new Response(JSON.stringify({ intent }), { status: 200 });
}
