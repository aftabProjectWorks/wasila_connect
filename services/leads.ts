/**
 * Lead Management Service - Group lead selection, transition, and approval
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog } from './audit';
import { updateGroupMember } from './groups';
import type { LeadTransition, ApiResponse } from '@/lib/types';

// ============================================================================
// LEAD TRANSITIONS
// ============================================================================

/**
 * Create a lead transition request
 * Can be initiated by admin, member, or system
 * May require approval depending on configuration
 */
export async function initiateLeadTransition(
  groupId: string,
  toMemberId: string,
  fromMemberId?: string,
  initiatedBy: 'member' | 'admin' | 'system' = 'admin',
  reason?: string,
  requiresApproval: boolean = false,
  actorId?: string
): Promise<ApiResponse<LeadTransition>> {
  try {
    const db = createServiceRoleClient();

    const effectiveAt = requiresApproval ? null : new Date().toISOString();

    const { data, error } = await db
      .from('lead_transitions')
      .insert({
        group_id: groupId,
        from_member_id: fromMemberId,
        to_member_id: toMemberId,
        initiated_by: initiatedBy,
        reason,
        approved: !requiresApproval,
        effective_at: effectiveAt,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // If no approval required, execute immediately
    if (!requiresApproval) {
      await executeLeadTransition(data.id, actorId);
    }

    await auditLog(
      db,
      actorId || null,
      'lead_transition',
      'other',
      data.id,
      null,
      data,
      {
        group_id: groupId,
        from_member_id: fromMemberId,
        to_member_id: toMemberId,
        initiated_by: initiatedBy,
      }
    );

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Get a lead transition
 */
export async function getLeadTransition(
  transitionId: string
): Promise<ApiResponse<LeadTransition>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('lead_transitions')
      .select('*')
      .eq('id', transitionId)
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
 * Approve a pending lead transition
 */
export async function approveLeadTransition(
  transitionId: string,
  actorId?: string
): Promise<ApiResponse<LeadTransition>> {
  try {
    const db = createServiceRoleClient();

    const { data: transition } = await db
      .from('lead_transitions')
      .select('*')
      .eq('id', transitionId)
      .single();

    if (!transition) {
      return { success: false, error: 'Transition not found' };
    }

    if (transition.approved) {
      return { success: false, error: 'Already approved' };
    }

    const { data, error } = await db
      .from('lead_transitions')
      .update({
        approved: true,
        effective_at: new Date().toISOString(),
      })
      .eq('id', transitionId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Execute the transition
    await executeLeadTransition(transitionId, actorId);

    await auditLog(
      db,
      actorId || null,
      'lead_transition',
      'other',
      transitionId,
      transition,
      data,
      { action: 'transition_approved' }
    );

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Execute the actual lead transition
 * Updates group_members role for both old and new leads
 */
async function executeLeadTransition(
  transitionId: string,
  actorId?: string
): Promise<void> {
  try {
    const db = createServiceRoleClient();

    const { data: transition } = await db
      .from('lead_transitions')
      .select('*')
      .eq('id', transitionId)
      .single();

    if (!transition) return;

    // Remove lead role from previous lead
    if (transition.from_member_id) {
      const { data: oldLeadMembership } = await db
        .from('group_members')
        .select('id')
        .eq('group_id', transition.group_id)
        .eq('member_id', transition.from_member_id)
        .single();

      if (oldLeadMembership) {
        await updateGroupMember(
          oldLeadMembership.id,
          { role: 'member' },
          actorId
        );
      }
    }

    // Assign lead role to new lead
    const { data: newLeadMembership } = await db
      .from('group_members')
      .select('id')
      .eq('group_id', transition.group_id)
      .eq('member_id', transition.to_member_id)
      .single();

    if (newLeadMembership) {
      await updateGroupMember(
        newLeadMembership.id,
        { role: 'lead' },
        actorId
      );
    }
  } catch (err) {
    console.error('Error executing lead transition:', err);
  }
}

/**
 * Reject a pending lead transition
 */
export async function rejectLeadTransition(
  transitionId: string,
  reason?: string,
  actorId?: string
): Promise<ApiResponse<void>> {
  try {
    const db = createServiceRoleClient();

    const { data: transition } = await db
      .from('lead_transitions')
      .select('*')
      .eq('id', transitionId)
      .single();

    if (!transition) {
      return { success: false, error: 'Transition not found' };
    }

    if (transition.approved || transition.effective_at) {
      return { success: false, error: 'Cannot reject approved transition' };
    }

    // Mark as expired/cancelled by setting effective_at to past
    await db
      .from('lead_transitions')
      .update({
        approved: false,
        effective_at: new Date(0).toISOString(), // Epoch time to indicate rejection
        metadata: { rejection_reason: reason },
      })
      .eq('id', transitionId);

    await auditLog(
      db,
      actorId || null,
      'lead_transition',
      'other',
      transitionId,
      transition,
      null,
      { action: 'transition_rejected', reason }
    );

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * List pending lead transitions for a group
 */
export async function listPendingTransitions(
  groupId: string
): Promise<ApiResponse<LeadTransition[]>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('lead_transitions')
      .select('*')
      .eq('group_id', groupId)
      .eq('approved', false)
      .is('effective_at', null)
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
 * List lead transition history for a group
 */
export async function listTransitionHistory(
  groupId: string,
  limit: number = 50
): Promise<ApiResponse<LeadTransition[]>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('lead_transitions')
      .select('*')
      .eq('group_id', groupId)
      .eq('approved', true)
      .not('effective_at', 'is', null)
      .order('effective_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Automatic system-controlled lead transition
 * Triggered by system when previous lead is inactive/suspended
 */
export async function systemInitiateLeadTransition(
  groupId: string,
  toMemberId: string,
  fromMemberId: string,
  reason: string = 'Previous lead inactive/suspended'
): Promise<ApiResponse<LeadTransition>> {
  return initiateLeadTransition(
    groupId,
    toMemberId,
    fromMemberId,
    'system',
    reason,
    false // No approval required for system transitions
  );
}
