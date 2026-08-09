/**
 * Policy Service - Admin-configurable business rules
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog } from './audit';
import type { Policy, PolicyDefaults, ApiResponse } from '@/lib/types';

/**
 * System-wide policy defaults
 */
export const POLICY_DEFAULTS: PolicyDefaults = {
  card_validity_days: 30,
  card_max_per_member: 5,
  card_daily_limit_sticks: 100,
  buffer_threshold_percent: 70,
  red_threshold_percent: 90,
  risk_calculation_method: 'linear',
};

/**
 * Get a policy value (system or group-level)
 * Falls back to system default, then hardcoded default
 */
export async function getPolicy(
  key: string,
  groupId?: string
): Promise<any> {
  try {
    const db = createServiceRoleClient();

    // Try group-level policy first
    if (groupId) {
      const { data: groupPolicy } = await db
        .from('policies')
        .select('value')
        .eq('scope', 'group')
        .eq('scope_id', groupId)
        .eq('key', key)
        .is('effective_to', null)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      if (groupPolicy) {
        return groupPolicy.value;
      }
    }

    // Try system policy
    const { data: systemPolicy } = await db
      .from('policies')
      .select('value')
      .eq('scope', 'system')
      .eq('key', key)
      .is('effective_to', null)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    if (systemPolicy) {
      return systemPolicy.value;
    }

    // Return hardcoded default
    const defaults = POLICY_DEFAULTS as Record<string, any>;
    return defaults[key];
  } catch (err) {
    const defaults = POLICY_DEFAULTS as Record<string, any>;
    return defaults[key];
  }
}

/**
 * Set a policy value
 */
export async function setPolicy(
  key: string,
  value: any,
  scope: 'system' | 'group' = 'system',
  scopeId?: string,
  actorId?: string
): Promise<ApiResponse<Policy>> {
  try {
    const db = createServiceRoleClient();

    // Invalidate previous policy if it exists
    if (scope === 'system') {
      await db
        .from('policies')
        .update({ effective_to: new Date().toISOString() })
        .eq('scope', 'system')
        .eq('key', key)
        .is('effective_to', null);
    } else if (scopeId) {
      await db
        .from('policies')
        .update({ effective_to: new Date().toISOString() })
        .eq('scope', 'group')
        .eq('scope_id', scopeId)
        .eq('key', key)
        .is('effective_to', null);
    }

    const { data, error } = await db
      .from('policies')
      .insert({
        scope,
        scope_id: scopeId,
        key,
        value,
        effective_from: new Date().toISOString(),
        created_by: actorId,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(
      db,
      actorId || null,
      'policy_change',
      'other',
      data.id,
      null,
      data,
      { policy_key: key, scope }
    );

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Get all active policies (system or group)
 */
export async function listPolicies(
  scope?: 'system' | 'group',
  scopeId?: string
): Promise<ApiResponse<Policy[]>> {
  try {
    const db = createServiceRoleClient();

    let query = db
      .from('policies')
      .select('*')
      .is('effective_to', null);

    if (scope) {
      query = query.eq('scope', scope);
    }

    if (scopeId) {
      query = query.eq('scope_id', scopeId);
    }

    const { data, error } = await query.order('effective_from', {
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
