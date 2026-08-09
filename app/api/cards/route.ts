import { NextRequest, NextResponse } from 'next/server';
import { issueCard, listMemberCards, getCard, useCardSticks, completeCard, quitCard } from '@/services/cards';
import { getActorFromRequest } from '@/services/request';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const memberId = url.searchParams.get('member_id');
    const groupId = url.searchParams.get('group_id') || undefined;
    const status = url.searchParams.get('status') || undefined;

    if (!memberId) return NextResponse.json({ success: false, error: 'member_id required' }, { status: 400 });

    const res = await listMemberCards(memberId, groupId, status);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // require authenticated actor
    const actor = await getActorFromRequest(req);
    if (!actor) return NextResponse.json({ success: false, error: 'unauthenticated' }, { status: 401 });

    const body = await req.json();
    const templateId = body?.template_id;
    const groupId = body?.group_id;
    const issuedTo = body?.issued_to;
    const sticksAllotted = Number(body?.sticks_allotted || 0);
    const validityDays = body?.validity_days;

    if (!templateId || !groupId || !issuedTo) return NextResponse.json({ success: false, error: 'template_id, group_id and issued_to are required' }, { status: 400 });

    const res = await issueCard(templateId, groupId, issuedTo, sticksAllotted, validityDays, actor);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });

    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
