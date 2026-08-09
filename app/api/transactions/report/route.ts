import { NextRequest, NextResponse } from 'next/server';
import { getTransactionReport } from '@/services/transactions';
import { getActorFromRequest } from '@/services/request';
import { isMemberAdmin } from '@/services/auth';

export async function GET(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) return NextResponse.json({ success: false, error: 'unauthenticated' }, { status: 401 });
    const ok = await isMemberAdmin(actor);
    if (!ok) return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const provider = url.searchParams.get('provider') || undefined;
    const fromDate = url.searchParams.get('fromDate') ? new Date(url.searchParams.get('fromDate') as string) : undefined;
    const toDate = url.searchParams.get('toDate') ? new Date(url.searchParams.get('toDate') as string) : undefined;

    const res = await getTransactionReport({ status, provider, fromDate, toDate, limit: 1000 });
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
