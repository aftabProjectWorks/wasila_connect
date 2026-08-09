import { NextRequest, NextResponse } from 'next/server';
import { getCard, useCardSticks, completeCard, quitCard } from '@/services/cards';

interface Params { params: { id: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const res = await getCard(params.id);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 404 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const action = body?.action;
    if (!action) return NextResponse.json({ success: false, error: 'action required' }, { status: 400 });

    if (action === 'use') {
      const qty = Number(body?.quantity || 0);
      const res = await useCardSticks(params.id, qty, body?.bufferPercent, body?.redPercent, body?.actor_id);
      if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      return NextResponse.json({ success: true, data: res.data });
    }

    if (action === 'complete') {
      const res = await completeCard(params.id, body?.reason, body?.actor_id);
      if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      return NextResponse.json({ success: true, data: res.data });
    }

    if (action === 'quit') {
      const res = await quitCard(params.id, body?.reason, body?.actor_id);
      if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      return NextResponse.json({ success: true, data: res.data });
    }

    return NextResponse.json({ success: false, error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
