import { NextRequest, NextResponse } from 'next/server';
import { createTransaction, markTransactionSucceeded } from '@/services/transactions';
import payments from '@/services/payments';
import { getActorFromRequest } from '@/services/request';
import { isMemberAdmin } from '@/services/auth';

export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) return NextResponse.json({ success: false, error: 'unauthenticated' }, { status: 401 });

    const isAdmin = await isMemberAdmin(actor);
    if (!isAdmin) return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });

    const body = await req.json();
    const { amount, payer_member_id, payee_member_id, payment_type, provider } = body;
    if (!amount) return NextResponse.json({ success: false, error: 'amount required' }, { status: 400 });

    const txn = await createTransaction(amount, payment_type || 'direct', payer_member_id, payee_member_id, body?.card_id, provider, actor, body?.metadata || {});
    if (!txn.success) return NextResponse.json({ success: false, error: txn.error }, { status: 400 });

    // Process via provider - for admin-created transactions, we may not call provider. Still process via configured provider if requested
    const paymentResult = await payments.processPayment(provider, { amount, currency: 'INR', payer_member_id, payee_member_id, metadata: body?.metadata || {} });

    if (paymentResult.success) {
      await markTransactionSucceeded(txn.data.id, paymentResult.provider_reference, actor);
      return NextResponse.json({ success: true, data: { transaction: txn.data, provider_result: paymentResult } });
    }

    await markTransactionSucceeded(txn.data.id, paymentResult.provider_reference, actor);
    return NextResponse.json({ success: false, error: 'Payment failed', data: { transaction: txn.data, provider_result: paymentResult } });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
