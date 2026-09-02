import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/src/shared/auth/authService';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function POST(req: NextRequest) {
  try {
    // 1. Verify caller is an Admin
    const admin = await getAdminContext(req);
    if (!admin.roles.includes('ADMIN') && !admin.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // 2. Fetch target user's role to determine redirect
    const { data: profile } = await adminSupabase
      .from('users')
      .select('roles:user_roles!user_roles_user_id_fkey(role_id)')
      .eq('id', targetUserId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = (profile.roles as any[]).map(r => r.role_id);
    // Prefer student portal if they are a student, otherwise tutor.
    const redirectUrl = roles.includes('STUDENT') ? '/student' : '/tutor';

    // 3. Set the cookies
    const cookieStore = await cookies();
    cookieStore.set('sb-impersonate', targetUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 4, // 4 hours
    });

    cookieStore.set('sb-impersonating', 'true', {
      httpOnly: false, // Accessible by client side scripts
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 4,
    });

    return NextResponse.json({ success: true, redirectUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Clear the cookies
    const cookieStore = await cookies();
    cookieStore.delete('sb-impersonate');
    cookieStore.delete('sb-impersonating');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to revert impersonation' }, { status: 500 });
  }
}
