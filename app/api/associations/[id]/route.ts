import { NextRequest, NextResponse } from 'next/server';
import { verifyAssociationOTP } from '@/services/associations';

interface Params { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const otp = body?.otp;
    if (!otp) return NextResponse.json({ success: false, error: 'otp required' }, { status: 400 });

    const res = await verifyAssociationOTP(params.id, otp);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
