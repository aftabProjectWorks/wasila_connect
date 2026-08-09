import { describe, it, expect } from 'vitest';
import { createTransaction, markTransactionSucceeded, getTransactionByReference } from '@/services/transactions';

// Transaction service tests (require DB)
describe('transactions', () => {
  it('creates and marks transaction succeeded', async () => {
    const res = await createTransaction(100, 'direct', null as any, null as any, null as any, 'mock', null as any, {});
    expect(res.success).toBe(true);
    const txn = res.data;
    expect(txn).toBeDefined();
    expect(txn?.id).toBeDefined();
    expect(txn?.reference).toBeDefined();

    if (!txn?.id || !txn?.reference) return;

    const mark = await markTransactionSucceeded(txn.id, 'mock_ref', null as any);
    expect(mark.success).toBe(true);

    const byRef = await getTransactionByReference(txn.reference);
    expect(byRef.success).toBe(true);
  });
});
