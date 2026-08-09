/**
 * Member Service - CRUD and business logic for members
 */

import { createServiceRoleClient } from './server';
import { auditLog } from '../audit';
import type { Member, MemberProfile, ApiResponse } from '../types';

export async function createMember(
  email: string,
  fullName?: string,
  phone?: string,
  supabaseUserId?: string
): Promise<ApiResponse<Member>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('members')
      .insert({
        email,
        full_name: fullName,
        phone,
        supabase_user_id: supabaseUserId,
        role: 'member',
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await auditLog(db, null, 'create', 'member', data.id, null, data, {
      email,
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getMember(memberId: string): Promise<ApiResponse<Member>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getMemberByEmail(
  email: string
): Promise<ApiResponse<Member>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('members')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateMember(
  memberId: string,
  updates: Partial<Member>,
  actorId?: string
): Promise<ApiResponse<Member>> {
  try {
    const db = createServiceRoleClient();

    // Get before state for audit
    const { data: before } = await db
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    const { data, error } = await db
      .from('members')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await auditLog(db, actorId || null, 'update', 'member', memberId, before, data);

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function listMembers(
  page: number = 1,
  perPage: number = 50
): Promise<ApiResponse<{ members: Member[]; total: number }>> {
  try {
    const db = createServiceRoleClient();

    const { data, error, count } = await db
      .from('members')
      .select('*', { count: 'exact' })
      .range((page - 1) * perPage, page * perPage - 1)
      .order('created_at', { ascending: false });

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

export async function getMemberProfile(
  memberId: string,
  groupId: string
): Promise<ApiResponse<MemberProfile>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('member_profiles')
      .select('*')
      .eq('member_id', memberId)
      .eq('group_id', groupId)
      .single();

    if (error) {
      // Create default profile if it doesn't exist
      return createMemberProfile(memberId, groupId);
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function createMemberProfile(
  memberId: string,
  groupId: string
): Promise<ApiResponse<MemberProfile>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('member_profiles')
      .insert({
        member_id: memberId,
        group_id: groupId,
        rating_avg: 0,
        activity_score: 0,
        cards_issued: 0,
        cards_completed: 0,
        cards_quit: 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateMemberProfile(
  profileId: string,
  updates: Partial<MemberProfile>
): Promise<ApiResponse<MemberProfile>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('member_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
