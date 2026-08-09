import { NextRequest, NextResponse } from 'next/server';
import { getCard, applyCardSticks, completeCard, quitCard } from '@/services/cards';

interface Params { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const { action } = body;

  if (action === 'use') {
    const qty = Number(body?.quantity || 0);
    const res = await applyCardSticks(params.id, qty, body?.bufferPercent, body?.redPercent, body?.actor_id);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  }

  if (action === 'complete') {
    const res = await completeCard(params.id, body?.actor_id);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  }

  if (action === 'quit') {
    const res = await quitCard(params.id, body?.actor_id);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
}
