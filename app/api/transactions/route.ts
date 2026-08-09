import { NextRequest, NextResponse } from 'next/server';
import { getTransaction, listMemberTransactions } from '@/services/transactions';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const memberId = url.searchParams.get('member_id');
    const role = (url.searchParams.get('role') as 'payer' | 'payee' | 'both') || 'both';

    if (memberId) {
      const res = await listMemberTransactions(memberId, role);
      if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      return NextResponse.json({ success: true, data: res.data });
    }

    return NextResponse.json({ success: false, error: 'member_id required' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // For manual transaction creation (admin use)
    const body = await req.json();
    const { amount, payment_type, payer_member_id, payee_member_id, card_id, provider, actor_id } = body;
    if (!amount) return NextResponse.json({ success: false, error: 'amount required' }, { status: 400 });

    const { createTransaction } = await import('@/services/transactions');
    const res = await createTransaction(amount, payment_type || 'direct', payer_member_id, payee_member_id, card_id, provider, actor_id, body?.metadata || {});
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
