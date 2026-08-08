import { describe, it, expect } from 'vitest';
import { addLedgerEntry } from '../services/ledgerService';

describe('ledgerService', () => {
  it('rejects negative amounts', async () => {
    let threw = false;
    try {
      // @ts-ignore
      await addLedgerEntry({ accountId: '00000000-0000-0000-0000-000000000000', kind: 'debit', amount: -10, source: 'test' });
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
