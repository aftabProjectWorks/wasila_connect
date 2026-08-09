/**
 * Associations Service - Handle group chains and OTP-based member invitations
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog } from './audit';
import type { Association, ApiResponse } from '@/lib/types';

/**
 * Generate a random 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create a new association (chain link) with OTP
 */
export async function createAssociation(
  groupId: string,
  inviterMemberId: string,
  actorId?: string,
  otpExpiryMinutes: number = 15
): Promise<ApiResponse<Association>> {
  try {
    const db = createServiceRoleClient();

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);

    const { data, error } = await db
      .from('associations')
      .insert({
        group_id: groupId,
        inviter_member_id: inviterMemberId,
        otp,
        otp_expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit
    await auditLog(
      db,
      actorId || inviterMemberId,
      'create',
      'other',
      data.id,
      null,
      data,
      { action: 'association_created', groupId }
    );

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Get an association by ID
 */
export async function getAssociation(
  associationId: string
): Promise<ApiResponse<Association>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('associations')
      .select('*')
      .eq('id', associationId)
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
 * Verify and complete an association with OTP
 * Returns the association only if OTP is valid and not expired
 */
export async function verifyAssociationOTP(
  associationId: string,
  otp: string
): Promise<ApiResponse<Association>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('associations')
      .select('*')
      .eq('id', associationId)
      .single();

    if (error) {
      return { success: false, error: 'Association not found' };
    }

    // Check if OTP is expired
    if (new Date(data.otp_expires_at) < new Date()) {
      return { success: false, error: 'OTP expired' };
    }

    // Check if OTP matches
    if (data.otp !== otp) {
      return { success: false, error: 'Invalid OTP' };
    }

    // Mark association as completed
    const { data: updated, error: updateError } = await db
      .from('associations')
      .update({
        status: 'completed',
        associated_at: new Date().toISOString(),
      })
      .eq('id', associationId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Cancel an association
 */
export async function cancelAssociation(
  associationId: string,
  actorId?: string
): Promise<ApiResponse<void>> {
  try {
    const db = createServiceRoleClient();

    const { error } = await db
      .from('associations')
      .update({ status: 'cancelled' })
      .eq('id', associationId);

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(
      db,
      actorId || null,
      'update',
      'other',
      associationId,
      null,
      { status: 'cancelled' },
      { action: 'association_cancelled' }
    );

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * List pending associations for a group
 */
export async function listGroupAssociations(
  groupId: string,
  status?: string
): Promise<ApiResponse<Association[]>> {
  try {
    const db = createServiceRoleClient();

    let query = db.from('associations').select('*').eq('group_id', groupId);

    if (status) {
      query = query.eq('status', status);
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
