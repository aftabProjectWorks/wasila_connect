import { NextRequest, NextResponse } from 'next/server';
import { createTransaction, markTransactionSucceeded } from '@/services/transactions';
import payments from '@/services/payments';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, payer_member_id, payee_member_id, payment_type, provider } = body;
    if (!amount) return NextResponse.json({ success: false, error: 'amount required' }, { status: 400 });

    const txn = await createTransaction(amount, payment_type || 'direct', payer_member_id, payee_member_id, body?.card_id, provider, body?.actor_id, body?.metadata || {});
    if (!txn.success) return NextResponse.json({ success: false, error: txn.error }, { status: 400 });

    // Process via provider
    const paymentResult = await payments.processPayment(provider, { amount, currency: 'INR', payer_member_id, payee_member_id, metadata: body?.metadata || {} });

    if (paymentResult.success) {
      // find transaction by reference? We have txn.data.id
      await markTransactionSucceeded(txn.data.id, paymentResult.provider_reference, body?.actor_id);
      return NextResponse.json({ success: true, data: { transaction: txn.data, provider_result: paymentResult } });
    }

    // If not success mark failed
    await markTransactionSucceeded(txn.data.id, paymentResult.provider_reference, body?.actor_id);
    return NextResponse.json({ success: false, error: 'Payment failed', data: { transaction: txn.data, provider_result: paymentResult } });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
