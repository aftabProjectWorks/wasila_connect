import { describe, it, expect } from 'vitest';
import { getOrCreateAccount, recordLedgerEntry } from '@/services/ledger';

// NOTE: These tests require a running Supabase instance pointed by env vars and are
// intended for local developer runs. They may be skipped in CI or use a mocked DB.

describe('ledger', () => {
  it('creates and records ledger entries', async () => {
    const acct = await getOrCreateAccount('system', undefined as any);
    expect(acct.success).toBe(true);
    const accountId = acct.data.id;

    const entry = await recordLedgerEntry(accountId, 'credit', 100, 'test', null, 'test', { test: true }, null as any);
    expect(entry.success).toBe(true);

    const second = await recordLedgerEntry(accountId, 'debit', 50, 'test2', null, 'test', {}, null as any);
    expect(second.success).toBe(true);
  });
});
