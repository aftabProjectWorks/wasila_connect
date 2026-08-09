/**
 * Transaction Service - Payment and transaction management
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog } from './audit';
import type { ApiResponse } from '@/lib/types';

export interface Transaction {
  id: string;
  reference: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  payment_type: string;
  payer_member_id?: string;
  payee_member_id?: string;
  card_id?: string;
  provider?: string;
  provider_reference?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

function generateReference(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function createTransaction(
  amount: number,
  paymentType: string,
  payerMemberId?: string | null,
  payeeMemberId?: string | null,
  cardId?: string | null,
  provider?: string,
  actorId?: string,
  metadata?: Record<string, any>
): Promise<ApiResponse<Transaction>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('transactions')
      .insert({
        reference: generateReference(),
        amount,
        status: 'pending',
        payment_type: paymentType,
        payer_member_id: payerMemberId,
        payee_member_id: payeeMemberId,
        card_id: cardId,
        provider: provider || 'direct',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(db, actorId || null, 'create', 'transaction', data.id, null, data, {
      amount,
      payment_type: paymentType,
      payer_member_id: payerMemberId,
      payee_member_id: payeeMemberId,
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function markTransactionSucceeded(
  transactionId: string,
  providerReference: string,
  actorId?: string
): Promise<ApiResponse<Transaction>> {
  try {
    const db = createServiceRoleClient();

    const { data: before } = await db
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    const { data, error } = await db
      .from('transactions')
      .update({
        status: 'succeeded',
        provider_reference: providerReference,
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
      'update',
      'transaction',
      transactionId,
      before,
      data,
      { status: 'succeeded' }
    );

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function markTransactionFailed(
  transactionId: string,
  error: string,
  actorId?: string
): Promise<ApiResponse<Transaction>> {
  try {
    const db = createServiceRoleClient();

    const { data: before } = await db
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    const { data, error: updateErr } = await db
      .from('transactions')
      .update({
        status: 'failed',
        metadata: { error },
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    await auditLog(
      db,
      actorId || null,
      'update',
      'transaction',
      transactionId,
      before,
      data,
      { status: 'failed', error }
    );

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

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
