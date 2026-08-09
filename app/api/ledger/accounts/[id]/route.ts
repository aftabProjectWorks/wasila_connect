import { NextRequest, NextResponse } from 'next/server';
import { getAccountEntries, recordLedgerEntry, getOrCreateAccount } from '@/services/ledger';

interface Params { params: { id: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const accountId = params.id;
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || '100');
    const offset = Number(url.searchParams.get('offset') || '0');

    const res = await getAccountEntries(accountId, limit, offset);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    // Create a ledger entry (admin operation)
    const accountId = params.id;
    const body = await req.json();
    const { kind, amount, source, reference_id, reference_type, metadata, actor_id } = body;
    if (!kind || !amount) return NextResponse.json({ success: false, error: 'kind and amount required' }, { status: 400 });

    const res = await recordLedgerEntry(accountId, kind, Number(amount), source || 'manual', reference_id, reference_type, metadata || {}, actor_id);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    // Return account info or create account if not exists
    const accountId = params.id;
    // support special keyword: create:member:<memberId> to create account by owner
    if (accountId.startsWith('create:')) {
      const parts = accountId.split(':');
      if (parts.length === 3 && parts[1] === 'member') {
        const memberId = parts[2];
        const res = await getOrCreateAccount('member', memberId);
        if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
        return NextResponse.json({ success: true, data: res.data });
      }
    }

    return NextResponse.json({ success: false, error: 'unsupported' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
