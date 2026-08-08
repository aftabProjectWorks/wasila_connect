// Simple audit helper wrapper used by server services
import { createServiceSupabase } from '../lib/supabaseClient';

export async function auditLog(dbClientOrSupabase, actorMemberId, actionType, resourceType, resourceId, beforeState, afterState, metadata = {}) {
  const supabase = dbClientOrSupabase ?? createServiceSupabase();
  await supabase.from('audit_logs').insert([{ actor_member_id: actorMemberId, action_type: actionType, resource_type: resourceType, resource_id: resourceId, before_state: beforeState || null, after_state: afterState || null, metadata }]);
}
