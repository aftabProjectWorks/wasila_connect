import { NextRequest, NextResponse } from 'next/server';
import { createAssociation, verifyAssociationOTP, listGroupAssociations } from '@/services/associations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { group_id, inviter_member_id, otp_expiry_minutes } = body;
    if (!group_id || !inviter_member_id) return NextResponse.json({ success: false, error: 'group_id and inviter_member_id required' }, { status: 400 });

    const res = await createAssociation(group_id, inviter_member_id, body?.actor_id, otp_expiry_minutes);
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

    const res = await listGroupAssociations(groupId);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
