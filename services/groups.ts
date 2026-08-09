/**
 * Group Service - CRUD and business logic for groups and membership
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog } from './audit';
import type {
  Group,
  GroupMember,
  GroupStatus,
  GroupMemberRole,
  ApiResponse,
} from '@/lib/types';

export async function createGroup(
  name: string,
  slug: string,
  description?: string,
  createdBy?: string,
  config: Record<string, any> = {}
): Promise<ApiResponse<Group>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('groups')
      .insert({
        name,
        slug: slug.toLowerCase(),
        description,
        config,
        status: 'active',
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit
    await auditLog(db, createdBy || null, 'create', 'group', data.id, null, data, {
      slug,
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getGroup(groupId: string): Promise<ApiResponse<Group>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getGroupBySlug(
  slug: string
): Promise<ApiResponse<Group>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('groups')
      .select('*')
      .eq('slug', slug.toLowerCase())
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateGroup(
  groupId: string,
  updates: Partial<Group>,
  actorId?: string
): Promise<ApiResponse<Group>> {
  try {
    const db = createServiceRoleClient();

    const { data: before } = await db
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    const { data, error } = await db
      .from('groups')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(db, actorId || null, 'update', 'group', groupId, before, data);

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function listGroups(
  page: number = 1,
  perPage: number = 50
): Promise<ApiResponse<{ groups: Group[]; total: number }>> {
  try {
    const db = createServiceRoleClient();

    const { data, error, count } = await db
      .from('groups')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .range((page - 1) * perPage, page * perPage - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { groups: data || [], total: count || 0 },
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ============================================================================
// GROUP MEMBERSHIP
// ============================================================================

export async function addGroupMember(
  groupId: string,
  memberId: string,
  role: GroupMemberRole = 'member',
  actorId?: string
): Promise<ApiResponse<GroupMember>> {
  try {
    const db = createServiceRoleClient();

    // Check if already a member
    const { data: existing } = await db
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('member_id', memberId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Member already in group' };
    }

    const { data, error } = await db
      .from('group_members')
      .insert({
        group_id: groupId,
        member_id: memberId,
        role,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(
      db,
      actorId || null,
      'create',
      'group',
      groupId,
      null,
      data,
      { action: 'member_added', memberId }
    );

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getGroupMember(
  groupId: string,
  memberId: string
): Promise<ApiResponse<GroupMember>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('member_id', memberId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateGroupMember(
  groupMemberId: string,
  updates: Partial<GroupMember>,
  actorId?: string
): Promise<ApiResponse<GroupMember>> {
  try {
    const db = createServiceRoleClient();

    const { data: before } = await db
      .from('group_members')
      .select('*')
      .eq('id', groupMemberId)
      .single();

    const { data, error } = await db
      .from('group_members')
      .update(updates)
      .eq('id', groupMemberId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(db, actorId || null, 'update', 'group', data.group_id, before, data);

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function listGroupMembers(
  groupId: string,
  status?: string,
  page: number = 1,
  perPage: number = 50
): Promise<ApiResponse<{ members: GroupMember[]; total: number }>> {
  try {
    const db = createServiceRoleClient();

    let query = db
      .from('group_members')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .range((page - 1) * perPage, page * perPage - 1)
      .order('joined_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { members: data || [], total: count || 0 },
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function removeGroupMember(
  groupMemberId: string,
  actorId?: string
): Promise<ApiResponse<void>> {
  try {
    const db = createServiceRoleClient();

    const { data: before } = await db
      .from('group_members')
      .select('*')
      .eq('id', groupMemberId)
      .single();

    const { error } = await db
      .from('group_members')
      .update({
        status: 'left',
        left_at: new Date().toISOString(),
      })
      .eq('id', groupMemberId);

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(
      db,
      actorId || null,
      'update',
      'group',
      before?.group_id,
      before,
      { ...before, status: 'left' }
    );

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getGroupLead(groupId: string): Promise<ApiResponse<GroupMember>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('role', 'lead')
      .eq('status', 'active')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
