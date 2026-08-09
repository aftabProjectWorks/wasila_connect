import { NextRequest, NextResponse } from 'next/server';
import { approveLeadTransition, rejectLeadTransition } from '@/services/leads';
import { getActorFromRequest } from '@/services/request';
import { isMemberAdmin } from '@/services/auth';

interface Params { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) return NextResponse.json({ success: false, error: 'unauthenticated' }, { status: 401 });
    const ok = await isMemberAdmin(actor);
    if (!ok) return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });

    const body = await req.json();
    const action = body?.action;
    if (!action) return NextResponse.json({ success: false, error: 'action required' }, { status: 400 });

    if (action === 'approve') {
      const res = await approveLeadTransition(params.id, actor);
      if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      return NextResponse.json({ success: true, data: res.data });
    }

    if (action === 'reject') {
      const res = await rejectLeadTransition(params.id, body?.reason, actor);
      if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
