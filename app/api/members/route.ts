import { NextRequest, NextResponse } from 'next/server';
import { createMember, listMembers } from '@/services/members';
import { getActorFromRequest } from '@/services/request';
import { isMemberAdmin } from '@/services/auth';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || '1');
    const per_page = Number(url.searchParams.get('per_page') || '50');

    const res = await listMembers(page, per_page);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });

    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) return NextResponse.json({ success: false, error: 'unauthenticated' }, { status: 401 });

    const isAdmin = await isMemberAdmin(actor);
    if (!isAdmin) return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });

    const body = await req.json();
    const email = body?.email;
    if (!email) return NextResponse.json({ success: false, error: 'email required' }, { status: 400 });

    const res = await createMember(email, body?.full_name, body?.phone, body?.supabase_user_id);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });

    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
