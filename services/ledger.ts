/**
 * Ledger Service - Financial accounting and transaction records
 * All financial operations are server-side and immutable for auditability
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog } from './audit';
import type {
  LedgerAccount,
  LedgerEntry,
  LedgerAccountOwnerType,
  ApiResponse,
} from '@/lib/types';

// ============================================================================
// LEDGER ACCOUNTS
// ============================================================================

/**
 * Get or create a ledger account for a member/group/system
 */
export async function getOrCreateAccount(
  ownerType: LedgerAccountOwnerType,
  ownerId?: string
): Promise<ApiResponse<LedgerAccount>> {
  try {
    const db = createServiceRoleClient();

    // Try to get existing account
    let query = db
      .from('ledger_accounts')
      .select('*')
      .eq('owner_type', ownerType);

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    } else {
      query = query.is('owner_id', null);
    }

    const { data: existing } = await query.single();

    if (existing) {
      return { success: true, data: existing };
    }

    // Create new account
    const { data, error } = await db
      .from('ledger_accounts')
      .insert({
        owner_type: ownerType,
        owner_id: ownerId,
        currency: 'INR',
        balance: 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getAccount(
  accountId: string
): Promise<ApiResponse<LedgerAccount>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('ledger_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ============================================================================
// LEDGER ENTRIES - Immutable transaction records
// ============================================================================

/**
 * Record a credit or debit entry
 * This is the primary mechanism for financial tracking
 * NEVER allow client-side modifications
 */
export async function recordLedgerEntry(
  accountId: string,
  kind: 'credit' | 'debit',
  amount: number,
  source: string,
  referenceId?: string,
  referenceType?: string,
  metadata: Record<string, any> = {},
  actorId?: string
): Promise<ApiResponse<LedgerEntry>> {
  try {
    const db = createServiceRoleClient();

    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // Get current account balance
    const { data: account, error: accountError } = await db
      .from('ledger_accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return { success: false, error: 'Account not found' };
    }

    // Calculate new balance
    const newBalance =
      kind === 'credit'
        ? account.balance + amount
        : Math.max(0, account.balance - amount);

    // Record entry
    const { data, error } = await db
      .from('ledger_entries')
      .insert({
        account_id: accountId,
        kind,
        amount,
        currency: 'INR',
        source,
        reference_id: referenceId,
        reference_type: referenceType,
        metadata,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Update account balance
    await db
      .from('ledger_accounts')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    // Audit
    await auditLog(
      db,
      actorId || null,
      'update',
      'other',
      accountId,
      { balance: account.balance },
      { balance: newBalance },
      {
        action: 'ledger_entry',
        kind,
        amount,
        source,
        reference_id: referenceId,
      }
    );

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Get ledger entries for an account
 */
export async function getAccountEntries(
  accountId: string,
  limit: number = 100,
  offset: number = 0
): Promise<ApiResponse<{ entries: LedgerEntry[]; total: number }>> {
  try {
    const db = createServiceRoleClient();

    const { data, error, count } = await db
      .from('ledger_entries')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { entries: data || [], total: count || 0 },
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Get entries by reference (e.g., all entries for a specific transaction)
 */
export async function getEntriesByReference(
  referenceId: string,
  referenceType: string
): Promise<ApiResponse<LedgerEntry[]>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('ledger_entries')
      .select('*')
      .eq('reference_id', referenceId)
      .eq('reference_type', referenceType)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Verify ledger integrity (for audits)
 * Recalculates balance from entries
 */
export async function verifyAccountBalance(
  accountId: string
): Promise<{ expected: number; actual: number; valid: boolean }> {
  try {
    const db = createServiceRoleClient();

    const { data: account } = await db
      .from('ledger_accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    const { data: entries } = await db
      .from('ledger_entries')
      .select('kind, amount')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true });

    let calculatedBalance = 0;
    if (entries) {
      calculatedBalance = entries.reduce((sum: number, entry: any) => {
        return entry.kind === 'credit'
          ? sum + entry.amount
          : Math.max(0, sum - entry.amount);
      }, 0);
    }

    return {
      expected: calculatedBalance,
      actual: account?.balance || 0,
      valid: Math.abs(calculatedBalance - (account?.balance || 0)) < 0.01,
    };
  } catch (err) {
    console.error('Error verifying account balance:', err);
    return { expected: 0, actual: 0, valid: false };
  }
}
