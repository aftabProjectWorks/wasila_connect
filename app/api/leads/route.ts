import { NextRequest, NextResponse } from 'next/server';
import { initiateLeadTransition, approveLeadTransition, rejectLeadTransition, listPendingTransitions } from '@/services/leads';
import { getActorFromRequest } from '@/services/request';
import { isMemberAdmin } from '@/services/auth';

export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) return NextResponse.json({ success: false, error: 'unauthenticated' }, { status: 401 });

    const body = await req.json();
    const { group_id, to_member_id, from_member_id, requiresApproval = false, reason } = body;
    if (!group_id || !to_member_id) return NextResponse.json({ success: false, error: 'group_id and to_member_id required' }, { status: 400 });

    const res = await initiateLeadTransition(group_id, to_member_id, from_member_id, 'member', reason, requiresApproval, actor);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const groupId = url.searchParams.get('group_id');
    if (!groupId) return NextResponse.json({ success: false, error: 'group_id required' }, { status: 400 });

    const res = await listPendingTransitions(groupId);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
