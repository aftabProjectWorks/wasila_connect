import { createServiceSupabase } from '../lib/supabaseClient';

export async function createLedgerAccount({ ownerType, ownerId, currency = 'INR' }: { ownerType: 'member' | 'group' | 'system'; ownerId?: string; currency?: string }) {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('ledger_accounts').insert([{ owner_type: ownerType, owner_id: ownerId || null, currency }]).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function addLedgerEntry({ accountId, kind, amount, source, metadata = {} }: { accountId: string; kind: 'credit' | 'debit'; amount: number; source: string; metadata?: any }) {
  if (amount <= 0) throw new Error('Amount must be positive');

  const supabase = createServiceSupabase();

  // Insert ledger entry
  const { data: entry, error: insertErr } = await supabase.from('ledger_entries').insert([{ account_id: accountId, kind, amount, source, metadata }]).select().maybeSingle();
  if (insertErr) throw insertErr;

  // Update account balance (not atomic here; should be replaced with a DB transaction or function in production to avoid race conditions)
  const { data: account, error: accErr } = await supabase.from('ledger_accounts').select('*').eq('id', accountId).limit(1).maybeSingle();
  if (accErr) throw accErr;
  const currentBalance = Number(account?.balance || 0);
  const newBalance = currentBalance + (kind === 'credit' ? amount : -amount);
  const { error: updErr } = await supabase.from('ledger_accounts').update({ balance: newBalance }).eq('id', accountId);
  if (updErr) throw updErr;

  return { entry, newBalance };
}
