/**
 * Audit Service - Logging and tracking changes
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApiResponse } from '@/lib/types';

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  before_state?: Record<string, any> | null;
  after_state?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export async function auditLog(
  db: SupabaseClient,
  actorId: string | null,
  action: string,
  resourceType: string,
  resourceId: string,
  beforeState?: Record<string, any> | null,
  afterState?: Record<string, any> | null,
  metadata?: Record<string, any> | null
): Promise<ApiResponse<AuditLog>> {
  try {
    const { data, error } = await db
      .from('audit_logs')
      .insert({
        actor_id: actorId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        before_state: beforeState,
        after_state: afterState,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Audit log error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Audit log exception:', err);
    return { success: false, error: String(err) };
  }
}
