import { NextRequest, NextResponse } from 'next/server';
import { getPolicy, setPolicy, listPolicies } from '@/services/policies';
import { getActorFromRequest } from '@/services/request';
import { isMemberAdmin } from '@/services/auth';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope') as 'system' | 'group' | null;
    const scopeId = url.searchParams.get('scope_id') || undefined;

    const res = await listPolicies(scope || undefined, scopeId);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) return NextResponse.json({ success: false, error: 'unauthenticated' }, { status: 401 });
    const ok = await isMemberAdmin(actor);
    if (!ok) return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });

    const body = await req.json();
    const { key, value, scope = 'system', scope_id } = body;
    if (!key) return NextResponse.json({ success: false, error: 'key required' }, { status: 400 });

    const res = await setPolicy(key, value, scope, scope_id, actor);
    if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
