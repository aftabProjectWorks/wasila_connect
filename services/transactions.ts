/**
 * Transaction Service - Payment and financial transaction management
 * Coordinates between payment providers and ledger
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog } from './audit';
import {
  recordLedgerEntry,
  getOrCreateAccount,
} from './ledger';
import type {
  Transaction,
  PaymentType,
  PaymentProvider,
  ApiResponse,
} from '@/lib/types';

// ============================================================================
// TRANSACTIONS
// ============================================================================

/**
 * Create a financial transaction record
 * This is the business record; payment provider integration is separate
 */
export async function createTransaction(
  amount: number,
  paymentType: PaymentType = 'direct',
  payerMemberId?: string,
  payeeMemberId?: string,
  cardId?: string,
  provider?: PaymentProvider,
  actorId?: string,
  metadata: Record<string, any> = {}
): Promise<ApiResponse<Transaction>> {
  try {
    const db = createServiceRoleClient();

    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    const reference = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const { data, error } = await db
      .from('transactions')
      .insert({
        reference,
        amount,
        currency: 'INR',
        payment_type: paymentType,
        status: 'pending',
        payer_member_id: payerMemberId,
        payee_member_id: payeeMemberId,
        card_id: cardId,
        provider,
        metadata,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(
      db,
      actorId || payerMemberId || null,
      'payment',
      'other',
      data.id,
      null,
      data,
      {
        payment_type: paymentType,
        amount,
        reference,
      }
    );

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Get a transaction by ID
 */
export async function getTransaction(
  transactionId: string
): Promise<ApiResponse<Transaction>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Get transaction by reference
 */
export async function getTransactionByReference(
  reference: string
): Promise<ApiResponse<Transaction>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Mark transaction as succeeded and record in ledger
 * This is called after successful payment provider confirmation
 */
export async function markTransactionSucceeded(
  transactionId: string,
  providerReference?: string,
  actorId?: string
): Promise<ApiResponse<Transaction>> {
  try {
    const db = createServiceRoleClient();

    const { data: txn, error: txnError } = await db
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txnError || !txn) {
      return { success: false, error: 'Transaction not found' };
    }

    if (txn.status !== 'pending') {
      return {
        success: false,
        error: `Transaction is already ${txn.status}`,
      };
    }

    // Update transaction status
    const { data: updated, error: updateError } = await db
      .from('transactions')
      .update({
        status: 'succeeded',
        provider_reference: providerReference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Record in ledger if payer specified
    if (txn.payer_member_id) {
      const payerAcct = await getOrCreateAccount('member', txn.payer_member_id);
      if (payerAcct.success && payerAcct.data) {
        await recordLedgerEntry(
          payerAcct.data.id,
          'debit',
          txn.amount,
          'payment',
          transactionId,
          'transaction',
          { provider: txn.provider },
          actorId
        );
      }
    }

    // Record in ledger if payee specified
    if (txn.payee_member_id) {
      const payeeAcct = await getOrCreateAccount('member', txn.payee_member_id);
      if (payeeAcct.success && payeeAcct.data) {
        await recordLedgerEntry(
          payeeAcct.data.id,
          'credit',
          txn.amount,
          'payment',
          transactionId,
          'transaction',
          { provider: txn.provider },
          actorId
        );
      }
    }

    await auditLog(
      db,
      actorId || null,
      'payment',
      'other',
      transactionId,
      txn,
      updated,
      { action: 'transaction_succeeded' }
    );

    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Mark transaction as failed
 */
export async function markTransactionFailed(
  transactionId: string,
  reason?: string,
  actorId?: string
): Promise<ApiResponse<Transaction>> {
  try {
    const db = createServiceRoleClient();

    const { data: txn } = await db
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    const { data: updated, error } = await db
      .from('transactions')
      .update({
        status: 'failed',
        metadata: { ...txn?.metadata, failure_reason: reason },
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(
      db,
      actorId || null,
      'payment',
      'other',
      transactionId,
      txn,
      updated,
      { action: 'transaction_failed', reason }
    );

    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * List transactions for a member
 */
export async function listMemberTransactions(
  memberId: string,
  role: 'payer' | 'payee' | 'both' = 'both'
): Promise<ApiResponse<Transaction[]>> {
  try {
    const db = createServiceRoleClient();

    let query = db.from('transactions').select('*');

    if (role === 'payer') {
      query = query.eq('payer_member_id', memberId);
    } else if (role === 'payee') {
      query = query.eq('payee_member_id', memberId);
    } else {
      // Get all transactions where user is either payer or payee
      query = query.or(
        `payer_member_id.eq.${memberId},payee_member_id.eq.${memberId}`
      );
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Get transaction reconciliation report
 */
export async function getTransactionReport(filters: {
  status?: string;
  provider?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}): Promise<ApiResponse<Transaction[]>> {
  try {
    const db = createServiceRoleClient();

    let query = db.from('transactions').select('*');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.provider) {
      query = query.eq('provider', filters.provider);
    }
    if (filters.fromDate) {
      query = query.gte(
        'created_at',
        filters.fromDate.toISOString()
      );
    }
    if (filters.toDate) {
      query = query.lte(
        'created_at',
        filters.toDate.toISOString()
      );
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(filters.limit || 1000);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
