/**
 * API Route: POST /api/auth/verify-email
 * -----------------------------------------------------------------------
 * Verifies email confirmation code (OTP) for user registration.
 * Synchronizes session cookies and activates public.users record.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, token, type = 'signup' } = body;

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and 6-digit confirmation code are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanToken = token.toString().trim();

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

    let { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanToken,
      type: type as any,
    });

    // Multi-type fallback: If user enters an OTP from a different email (signup vs magiclink resend)
    if (error && (type === 'signup' || type === 'magiclink')) {
      const altType = type === 'signup' ? 'magiclink' : 'signup';
      const altRes = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanToken,
        type: altType as any,
      });
      if (!altRes.error && altRes.data?.user) {
        data = altRes.data;
        error = null;
      }
    }

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Invalid or expired confirmation code.' },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Verification failed. Please try requesting a new code.' },
        { status: 400 }
      );
    }

    // Activate the public user row and ensure auth email confirmation is marked
    try {
      await Promise.all([
        adminSupabase
          .from('users')
          .update({ status: 'ACTIVE' })
          .eq('auth_id', data.user.id),
        adminSupabase.auth.admin.updateUserById(data.user.id, {
          email_confirm: true,
        }),
      ]);
    } catch (dbErr: any) {
      console.warn('[verify-email user status update]', dbErr?.message);
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
      message: 'Email confirmed successfully. Welcome to Sabina LMS!',
    });
  } catch (err: any) {
    console.error('[POST /api/auth/verify-email]', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
