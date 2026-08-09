import { NextRequest, NextResponse } from 'next/server';
import { listGroups, createGroup, getGroup } from '@/services/groups';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || '1');
    const per_page = Number(url.searchParams.get('per_page') || '50');

    const res = await listGroups(page, per_page);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body?.name;
    const slug = body?.slug;
    if (!name || !slug) return NextResponse.json({ success: false, error: 'name and slug required' }, { status: 400 });

    const res = await createGroup(name, slug, body?.description, body?.created_by, body?.config || {});
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
