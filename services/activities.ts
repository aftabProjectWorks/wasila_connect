/**
 * Activity & Rating Service - Track member activities and peer ratings
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog } from './audit';
import type { Activity, Rating, ActivityType, ApiResponse } from '@/lib/types';

// ============================================================================
// ACTIVITIES
// ============================================================================

export async function recordActivity(
  memberId: string,
  groupId: string,
  type: ActivityType,
  quantity: number = 0,
  points: number = 0,
  cardId?: string,
  actorId?: string
): Promise<ApiResponse<Activity>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('activities')
      .insert({
        member_id: memberId,
        group_id: groupId,
        card_id: cardId,
        type,
        quantity,
        points,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(db, actorId || memberId, 'create', 'activity', data.id, null, data, {
      activity_type: type,
      quantity,
      points,
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getActivity(activityId: string): Promise<ApiResponse<Activity>> {
  try {
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function listMemberActivities(
  memberId: string,
  groupId?: string,
  limit: number = 50
): Promise<ApiResponse<Activity[]>> {
  try {
    const db = createServiceRoleClient();

    let query = db
      .from('activities')
      .select('*')
      .eq('member_id', memberId);

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ============================================================================
// RATINGS
// ============================================================================

export async function rateActivity(
  raterMemberId: string,
  ratedMemberId: string,
  activityId: string,
  groupId: string,
  rating: number,
  comment?: string,
  actorId?: string
): Promise<ApiResponse<Rating>> {
  try {
    const db = createServiceRoleClient();

    // Validate rating
    if (rating < 0 || rating > 5) {
      return { success: false, error: 'Rating must be between 0 and 5' };
    }

    // Check if already rated this activity
    const { data: existing } = await db
      .from('ratings')
      .select('id')
      .eq('rater_member_id', raterMemberId)
      .eq('activity_id', activityId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Already rated this activity' };
    }

    const { data, error } = await db
      .from('ratings')
      .insert({
        rater_member_id: raterMemberId,
        rated_member_id: ratedMemberId,
        activity_id: activityId,
        group_id: groupId,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(
      db,
      actorId || raterMemberId,
      'create',
      'other',
      data.id,
      null,
      data,
      { action: 'rating_recorded', rating, rated_member_id: ratedMemberId }
    );

    // Update member profile with new average
    await updateMemberProfileRating(ratedMemberId, groupId);

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getMemberRatings(
  memberId: string,
  groupId?: string
): Promise<ApiResponse<Rating[]>> {
  try {
    const db = createServiceRoleClient();

    let query = db
      .from('ratings')
      .select('*')
      .eq('rated_member_id', memberId);

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query.order('created_at', {
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

/**
 * Calculate and update member profile rating
 */
async function updateMemberProfileRating(
  memberId: string,
  groupId: string
): Promise<void> {
  try {
    const db = createServiceRoleClient();

    // Calculate average rating
    const { data: ratings } = await db
      .from('ratings')
      .select('rating')
      .eq('rated_member_id', memberId)
      .eq('group_id', groupId);

    const avgRating =
      ratings && ratings.length > 0
        ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
          ratings.length
        : 0;

    // Update profile
    const { data: profile } = await db
      .from('member_profiles')
      .select('id')
      .eq('member_id', memberId)
      .eq('group_id', groupId)
      .single();

    if (profile) {
      await db
        .from('member_profiles')
        .update({
          rating_avg: parseFloat(avgRating.toFixed(2)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
    }
  } catch (err) {
    console.error('Error updating member profile rating:', err);
  }
}

export async function deleteRating(
  ratingId: string,
  actorId?: string
): Promise<ApiResponse<void>> {
  try {
    const db = createServiceRoleClient();

    const { data: rating } = await db
      .from('ratings')
      .select('*')
      .eq('id', ratingId)
      .single();

    const { error } = await db
      .from('ratings')
      .delete()
      .eq('id', ratingId);

    if (error) {
      return { success: false, error: error.message };
    }

    await auditLog(
      db,
      actorId || null,
      'delete',
      'other',
      ratingId,
      rating,
      null
    );

    // Recalculate member profile rating
    if (rating) {
      await updateMemberProfileRating(
        rating.rated_member_id,
        rating.group_id
      );
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
