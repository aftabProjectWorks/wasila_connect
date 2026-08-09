import { NextRequest, NextResponse } from 'next/server';
import { addGroupMember, listGroupMembers } from '@/services/groups';

interface Params { params: { id: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const groupId = params.id;
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || '1');
    const per_page = Number(url.searchParams.get('per_page') || '50');
    const status = url.searchParams.get('status') || undefined;

    const res = await listGroupMembers(groupId, status, page, per_page);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const groupId = params.id;
    const body = await req.json();
    const memberId = body?.member_id;
    const role = body?.role || 'member';
    if (!memberId) return NextResponse.json({ success: false, error: 'member_id required' }, { status: 400 });

    const res = await addGroupMember(groupId, memberId, role, body?.actor_id);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
