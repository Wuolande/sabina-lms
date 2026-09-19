/**
 * API Route: POST /api/auth/logout
 * -----------------------------------------------------------------------
 * Enterprise Logout Handler:
 * Terminates the authenticated Supabase session, expires cookies,
 * and clears server-side authentication state.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    await supabase.auth.signOut();

    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (err: any) {
    console.error('[POST /api/auth/logout]', err);
    return NextResponse.json({ error: err.message || 'Logout failed' }, { status: 500 });
  }
}
