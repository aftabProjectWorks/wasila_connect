import { NextRequest, NextResponse } from 'next/server';
import { getGroup } from '@/services/groups';

interface Params { params: { id: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const res = await getGroup(params.id);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 404 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
