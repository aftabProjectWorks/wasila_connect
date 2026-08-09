/**
 * Ledger Service - Financial ledger entries and account management
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog } from './audit';
import type { ApiResponse } from '@/lib/types';

export interface LedgerAccount {
  id: string;
  account_holder: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  account_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_id?: string;
  reference_type?: string;
  category: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export async function getOrCreateAccount(
  accountHolder: string,
  actorId?: string
): Promise<ApiResponse<LedgerAccount>> {
  try {
    const db = createServiceRoleClient();

    // Try to get existing account
    const { data: existing } = await db
      .from('ledger_accounts')
      .select('*')
      .eq('account_holder', accountHolder)
      .maybeSingle();

    if (existing) {
      return { success: true, data: existing };
    }

    // Create new account
    const { data, error } = await db
      .from('ledger_accounts')
      .insert({
        account_holder: accountHolder,
        balance: 0,
        currency: 'INR',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(db, actorId || null, 'create', 'ledger_account', data.id, null, data, {
      account_holder: accountHolder,
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function recordLedgerEntry(
  accountId: string,
  type: 'credit' | 'debit',
  amount: number,
  description: string,
  referenceId?: string | null,
  referenceType?: string,
  metadata?: Record<string, any>,
  actorId?: string
): Promise<ApiResponse<LedgerEntry>> {
  try {
    const db = createServiceRoleClient();

    // Get current balance
    const { data: account } = await db
      .from('ledger_accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Calculate new balance
    const newBalance = type === 'credit' ? account.balance + amount : account.balance - amount;

    if (newBalance < 0) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Record entry
    const { data, error } = await db
      .from('ledger_entries')
      .insert({
        account_id: accountId,
        type,
        amount,
        description,
        reference_id: referenceId,
        reference_type: referenceType,
        category: 'general',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Update account balance
    await db
      .from('ledger_accounts')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', accountId);

    await auditLog(db, actorId || null, 'create', 'ledger_entry', data.id, null, data, {
      account_id: accountId,
      type,
      amount,
      description,
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getAccountBalance(accountId: string): Promise<ApiResponse<number>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('ledger_accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data?.balance || 0 };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getAccountEntries(
  accountId: string,
  limit: number = 100,
  offset: number = 0
): Promise<ApiResponse<LedgerEntry[]>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('ledger_entries')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function verifyAccountBalance(accountId: string): Promise<boolean> {
  try {
    const db = createServiceRoleClient();

    const { data: entries } = await db
      .from('ledger_entries')
      .select('type, amount')
      .eq('account_id', accountId);

    if (!entries) return false;

    // Calculate sum from entries
    let calculatedBalance = 0;
    for (const entry of entries) {
      if (entry.type === 'credit') {
        calculatedBalance += entry.amount;
      } else {
        calculatedBalance -= entry.amount;
      }
    }

    // Compare with stored balance
    const { data: account } = await db
      .from('ledger_accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    return account?.balance === calculatedBalance;
  } catch (err) {
    console.error('Error verifying account balance:', err);
    return false;
  }
}
