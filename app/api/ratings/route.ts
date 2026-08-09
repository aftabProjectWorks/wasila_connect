import { NextRequest, NextResponse } from 'next/server';
import { rateActivity, getMemberRatings, deleteRating } from '@/services/activities';
import { getActorFromRequest } from '@/services/request';
import { isMemberAdmin } from '@/services/auth';

export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) return NextResponse.json({ success: false, error: 'unauthenticated' }, { status: 401 });

    const body = await req.json();
    const raterMemberId = body?.rater_member_id || actor;
    const ratedMemberId = body?.rated_member_id;
    const activityId = body?.activity_id;
    const groupId = body?.group_id;
    const rating = Number(body?.rating);
    const comment = body?.comment;

    if (!ratedMemberId || !activityId || !groupId || typeof rating !== 'number') return NextResponse.json({ success: false, error: 'rated_member_id, activity_id, group_id and rating required' }, { status: 400 });

    const res = await rateActivity(raterMemberId, ratedMemberId, activityId, groupId, rating, comment, actor);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });

    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const memberId = url.searchParams.get('member_id');
    const groupId = url.searchParams.get('group_id') || undefined;

    if (!memberId) return NextResponse.json({ success: false, error: 'member_id required' }, { status: 400 });

    const res = await getMemberRatings(memberId, groupId);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });

    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) return NextResponse.json({ success: false, error: 'unauthenticated' }, { status: 401 });

    const url = new URL(req.url);
    const ratingId = url.searchParams.get('rating_id');
    if (!ratingId) return NextResponse.json({ success: false, error: 'rating_id required' }, { status: 400 });

    // allow admin or actor who created rating (simpler: only admin)
    const ok = await isMemberAdmin(actor);
    if (!ok) return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });

    const res = await deleteRating(ratingId, actor);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
