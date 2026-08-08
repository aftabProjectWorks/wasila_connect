export async function auditLog(dbClient, actorMemberId, actionType, resourceType, resourceId, beforeState, afterState, metadata = {}) {
  // dbClient should be a Supabase service role client passed from server-side code
  if (!dbClient) throw new Error('Missing db client for audit log');
  await dbClient.from('audit_logs').insert({
    actor_member_id: actorMemberId,
    action_type: actionType,
    resource_type: resourceType,
    resource_id: resourceId,
    before_state: beforeState || null,
    after_state: afterState || null,
    metadata,
  });
}
