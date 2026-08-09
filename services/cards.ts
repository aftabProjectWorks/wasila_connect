/**
 * Card Template and Card Services - Manage card types and issued cards
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog } from './audit';
import type {
  CardTemplate,
  Card,
  RiskState,
  ApiResponse,
  PolicyDefaults,
} from '@/lib/types';

// ============================================================================
// CARD TEMPLATES
// ============================================================================

export async function createCardTemplate(
  name: string,
  config: Record<string, any>,
  stickFormula?: string,
  stickUnit: string = 'piece',
  createdBy?: string
): Promise<ApiResponse<CardTemplate>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('card_templates')
      .insert({
        name,
        config,
        stick_formula: stickFormula,
        stick_unit: stickUnit,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(db, createdBy || null, 'create', 'other', data.id, null, data, {
      action: 'card_template_created',
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getCardTemplate(
  templateId: string
): Promise<ApiResponse<CardTemplate>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('card_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function listCardTemplates(): Promise<
  ApiResponse<{ templates: CardTemplate[] }>
> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('card_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { templates: data || [] } };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ============================================================================
// CARDS
// ============================================================================

/**
 * Calculate risk state based on sticks used vs allotted
 * Green: < buffer threshold
 * Orange: >= buffer, < red threshold
 * Red: >= red threshold
 */
function calculateRiskState(
  sticksUsed: number,
  sticksAllotted: number,
  bufferPercent: number = 70,
  redPercent: number = 90
): RiskState {
  if (sticksAllotted === 0) return 'green';

  const usedPercent = (sticksUsed / sticksAllotted) * 100;

  if (usedPercent >= redPercent) return 'red';
  if (usedPercent >= bufferPercent) return 'orange';
  return 'green';
}

export async function issueCard(
  templateId: string,
  groupId: string,
  issuedTo: string,
  sticksAllotted: number,
  validityDays?: number,
  actorId?: string
): Promise<ApiResponse<Card>> {
  try {
    const db = createServiceRoleClient();

    const issuedAt = new Date();
    const expiresAt = validityDays
      ? new Date(issuedAt.getTime() + validityDays * 24 * 60 * 60 * 1000)
      : null;

    const { data, error } = await db
      .from('cards')
      .insert({
        template_id: templateId,
        group_id: groupId,
        issued_to: issuedTo,
        issued_at: issuedAt.toISOString(),
        status: 'active',
        validity_days: validityDays,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        sticks_allotted: sticksAllotted,
        sticks_used: 0,
        risk_state: 'green',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(db, actorId || null, 'card_issue', 'card', data.id, null, data, {
      template_id: templateId,
      group_id: groupId,
      issued_to: issuedTo,
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getCard(cardId: string): Promise<ApiResponse<Card>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function listMemberCards(
  memberId: string,
  groupId?: string,
  status?: string
): Promise<ApiResponse<{ cards: Card[] }>> {
  try {
    const db = createServiceRoleClient();

    let query = db
      .from('cards')
      .select('*')
      .eq('issued_to', memberId);

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('issued_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { cards: data || [] } };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Record sticks usage on a card
 * Updates risk state based on usage percentage
 */
export async function useCardSticks(
  cardId: string,
  quantity: number,
  bufferPercent: number = 70,
  redPercent: number = 90,
  actorId?: string
): Promise<ApiResponse<Card>> {
  try {
    const db = createServiceRoleClient();

    const { data: before } = await db
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (!before) {
      return { success: false, error: 'Card not found' };
    }

    if (before.status !== 'active') {
      return { success: false, error: `Card is ${before.status}` };
    }

    // Check if expiration date has passed
    if (
      before.expires_at &&
      new Date(before.expires_at) < new Date()
    ) {
      // Automatically expire the card
      await db.from('cards').update({ status: 'expired' }).eq('id', cardId);
      return { success: false, error: 'Card has expired' };
    }

    const newSticksUsed = before.sticks_used + quantity;

    if (newSticksUsed > before.sticks_allotted) {
      return {
        success: false,
        error: `Exceeds allotted sticks (${before.sticks_allotted})`,
      };
    }

    const newRiskState = calculateRiskState(
      newSticksUsed,
      before.sticks_allotted,
      bufferPercent,
      redPercent
    );

    const { data, error } = await db
      .from('cards')
      .update({
        sticks_used: newSticksUsed,
        risk_state: newRiskState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(db, actorId || null, 'update', 'card', cardId, before, data, {
      action: 'sticks_used',
      quantity,
      new_risk_state: newRiskState,
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Complete a card (all sticks used or member satisfied)
 */
export async function completeCard(
  cardId: string,
  reason?: string,
  actorId?: string
): Promise<ApiResponse<Card>> {
  try {
    const db = createServiceRoleClient();

    const { data: before } = await db
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    const { data, error } = await db
      .from('cards')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(db, actorId || null, 'card_complete', 'card', cardId, before, data, {
      reason,
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Quit a card (member withdrawal before completion)
 */
export async function quitCard(
  cardId: string,
  reason?: string,
  actorId?: string
): Promise<ApiResponse<Card>> {
  try {
    const db = createServiceRoleClient();

    const { data: before } = await db
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    const { data, error } = await db
      .from('cards')
      .update({
        status: 'quit',
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(db, actorId || null, 'card_quit', 'card', cardId, before, data, {
      reason,
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
