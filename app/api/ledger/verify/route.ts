import { NextRequest, NextResponse } from 'next/server';
import { verifyAccountBalance } from '@/services/ledger';
import { getActorFromRequest } from '@/services/request';
import { isMemberAdmin } from '@/services/auth';

export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) return NextResponse.json({ success: false, error: 'unauthenticated' }, { status: 401 });
    const ok = await isMemberAdmin(actor);
    if (!ok) return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });

    const body = await req.json();
    const accountId = body?.account_id;
    if (!accountId) return NextResponse.json({ success: false, error: 'account_id required' }, { status: 400 });

    const res = await verifyAccountBalance(accountId);
    return NextResponse.json({ success: true, data: res });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
