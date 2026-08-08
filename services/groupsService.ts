import { createServiceSupabase } from '../lib/supabaseClient';
import { auditLog } from './auditHelper';

export async function createGroup({ name, slug, description, createdBy }: { name: string; slug: string; description?: string; createdBy?: string }) {
  const supabase = createServiceSupabase();
  const { data: group, error } = await supabase.from('groups').insert([{ name, slug, description }]).select().maybeSingle();
  if (error) throw error;

  // Add creator as group member and lead
  await supabase.from('group_members').insert([{ group_id: group.id, member_id: createdBy, role: 'lead' }]);

  await auditLog(supabase, createdBy || null, 'group.create', 'group', group.id, null, group, {});
  return group;
}
