import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabaseClient';
import { createOrGetMemberFromAuth } from '@/services/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accessToken = body?.access_token;
    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'access_token required' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    // getUser using the access token
    const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
    if (userErr) {
      return NextResponse.json({ success: false, error: String(userErr) }, { status: 500 });
    }

    // Handle both response formats from Supabase
    const user = userData?.user || (userData as any)?.data?.user;
    if (!user) {
      return NextResponse.json({ success: false, error: 'user not found' }, { status: 404 });
    }

    // Ensure member exists
    const member = await createOrGetMemberFromAuth({ id: user.id, email: user.email, user_metadata: user.user_metadata });

    return NextResponse.json({ success: true, data: member });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
