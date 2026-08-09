import { NextRequest, NextResponse } from 'next/server';
import { recordActivity, listMemberActivities } from '@/services/activities';
import { getActorFromRequest } from '@/services/request';

export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) return NextResponse.json({ success: false, error: 'unauthenticated' }, { status: 401 });

    const body = await req.json();
    const memberId = body?.member_id || actor;
    const groupId = body?.group_id;
    const type = body?.type;
    const quantity = Number(body?.quantity || 0);
    const points = Number(body?.points || 0);
    const cardId = body?.card_id;

    if (!memberId || !groupId || !type) return NextResponse.json({ success: false, error: 'member_id, group_id and type are required' }, { status: 400 });

    const res = await recordActivity(memberId, groupId, type, quantity, points, cardId, actor);
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
    const limit = Number(url.searchParams.get('limit') || '50');

    if (!memberId) return NextResponse.json({ success: false, error: 'member_id required' }, { status: 400 });

    const res = await listMemberActivities(memberId, groupId, limit);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });

    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
