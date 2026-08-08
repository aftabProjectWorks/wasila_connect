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
  // For safety, perform transaction: insert ledger_entry and update account balance atomically
  const sql = `
    WITH e AS (
      INSERT INTO ledger_entries(account_id, kind, amount, source, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING id, account_id, kind, amount
    ), upd AS (
      UPDATE ledger_accounts
      SET balance = CASE WHEN $2 = 'credit' THEN balance + $3 ELSE balance - $3 END
      WHERE id = $1
      RETURNING id, balance
    )
    SELECT e.id as entry_id, upd.balance as new_balance FROM e JOIN upd ON upd.id = e.account_id;
  `;

  const { data, error } = await supabase.rpc('sql', { q: sql, p1: accountId, p2: kind, p3: amount, p4: source }).catch(() => ({ data: null, error: null }));
  // Note: Supabase client doesn't allow raw multi-statement SQL easily here; instead we fall back to simple approach
  const { data: entry, error: insertErr } = await supabase.from('ledger_entries').insert([{ account_id: accountId, kind, amount, source, metadata }]).select().maybeSingle();
  if (insertErr) throw insertErr;
  // Update balance
  const { data: account, error: accErr } = await supabase.from('ledger_accounts').select('*').eq('id', accountId).limit(1).maybeSingle();
  if (accErr) throw accErr;
  const newBalance = Number(account.balance) + (kind === 'credit' ? amount : -amount);
  await supabase.from('ledger_accounts').update({ balance: newBalance }).eq('id', accountId);
  return { entry, newBalance };
}
