import { describe, it, expect } from 'vitest';
import { getOrCreateAccount, recordLedgerEntry } from '@/services/ledger';

// NOTE: These tests require a running Supabase instance pointed by env vars and are
// intended for local developer runs. They may be skipped in CI or use a mocked DB.

describe('ledger', () => {
  it('creates and records ledger entries', async () => {
    const acct = await getOrCreateAccount('system', undefined as any);
    expect(acct.success).toBe(true);
    const accountId = acct.data?.id;
    expect(accountId).toBeDefined();

    if (!accountId) return;

    const entry = await recordLedgerEntry(accountId, 'credit', 100, 'test', undefined, 'test', { test: true }, null as any);
    expect(entry.success).toBe(true);

    const second = await recordLedgerEntry(accountId, 'debit', 50, 'test2', undefined, 'test', {}, null as any);
    expect(second.success).toBe(true);
  });
});
