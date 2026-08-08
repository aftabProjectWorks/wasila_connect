import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceSupabase } from '../lib/supabaseClient';

export async function auditLog(
  dbClient?: SupabaseClient | null,
  actorMemberId?: string | null,
  actionType?: string,
  resourceType?: string | null,
  resourceId?: string | null,
  beforeState?: Record<string, unknown> | null,
  afterState?: Record<string, unknown> | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase: SupabaseClient = dbClient ?? createServiceSupabase();

  await supabase.from('audit_logs').insert([
    {
      actor_member_id: actorMemberId,
      action_type: actionType || 'unknown',
      resource_type: resourceType,
      resource_id: resourceId,
      before_state: beforeState || null,
      after_state: afterState || null,
      metadata,
    },
  ]);
}
