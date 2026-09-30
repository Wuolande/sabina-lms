/**
 * API Route: POST /api/auth/verify-email
 * -----------------------------------------------------------------------
 * Verifies 6-digit email confirmation code (OTP) for user registration.
 * Checks against the 6-digit code in public.users.confirmation_token first,
 * with fallback to Supabase GoTrue OTP verification.
 * Automatically activates public.users, marks email_confirmed_at,
 * and synchronizes authenticated session cookies.
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

    // 1. Primary check: Verify 6-digit OTP stored in public.users record
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('id, auth_id, email, display_name, status, confirmation_token, confirmation_sent_at, roles:user_roles!user_roles_user_id_fkey(role_id)')
      .eq('email', normalizedEmail)
      .maybeSingle();

    let verified = false;
    let authUserId = dbUser?.auth_id;

    if (dbUser && dbUser.confirmation_token && dbUser.confirmation_token === cleanToken) {
      // Validate expiration window (24 hours)
      const sentTime = dbUser.confirmation_sent_at ? new Date(dbUser.confirmation_sent_at).getTime() : 0;
      const isExpired = sentTime > 0 && Date.now() - sentTime > 24 * 60 * 60 * 1000;

      if (!isExpired) {
        verified = true;
      }
    }

    // 2. Fallback check: Verify via Supabase GoTrue OTP
    let sessionData: any = null;

    if (!verified) {
      let { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanToken,
        type: type as any,
      });

      if (otpError && (type === 'signup' || type === 'magiclink')) {
        const altType = type === 'signup' ? 'magiclink' : 'signup';
        const altRes = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: cleanToken,
          type: altType as any,
        });
        if (!altRes.error && altRes.data?.user) {
          otpData = altRes.data;
          otpError = null;
        }
      }

      if (!otpError && otpData?.user) {
        verified = true;
        authUserId = otpData.user.id;
        sessionData = otpData.session;
      }
    }

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid or expired 6-digit confirmation code. Please check your email or click resend.' },
        { status: 400 }
      );
    }

    // 3. Mark user ACTIVE and email confirmed in both public.users and auth.users
    try {
      await Promise.all([
        adminSupabase
          .from('users')
          .update({
            status: 'ACTIVE',
            confirmation_token: null,
            confirmation_sent_at: null,
          })
          .eq('email', normalizedEmail),
        authUserId
          ? adminSupabase.auth.admin.updateUserById(authUserId, { email_confirm: true })
          : Promise.resolve(),
      ]);
    } catch (dbErr: any) {
      console.warn('[verify-email activation error]', dbErr?.message);
    }

    // 4. If no session was established yet, generate and exchange a magiclink token to set session cookies
    if (!sessionData) {
      try {
        const { data: linkRes } = await adminSupabase.auth.admin.generateLink({
          type: 'magiclink',
          email: normalizedEmail,
        });

        if (linkRes?.properties?.hashed_token) {
          const { data: exchangeData } = await supabase.auth.verifyOtp({
            token_hash: linkRes.properties.hashed_token,
            type: 'magiclink',
          });
          sessionData = exchangeData?.session;
        }
      } catch (sessErr: any) {
        console.warn('[verify-email session creation]', sessErr?.message);
      }
    }

    // Determine role for client navigation
    const roleId = dbUser?.roles?.[0]?.role_id || 'STUDENT';

    return NextResponse.json({
      success: true,
      user: {
        id: authUserId || dbUser?.id,
        email: normalizedEmail,
        role: roleId,
      },
      session: sessionData,
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
