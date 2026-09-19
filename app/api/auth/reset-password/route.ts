/**
 * API Route: POST /api/auth/reset-password
 * -----------------------------------------------------------------------
 * Enterprise Password Reset Confirmation.
 * Validates new password strength, verifies reCAPTCHA, confirms token/code,
 * updates credentials, and records security audit trail.
 * Strictly verifies that a valid token, PKCE code, or recovery session exists
 * and rejects unverified requests with 400 Bad Request.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';
import { adminSupabase } from '@/src/shared/database/supabase';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { verifyRecaptchaToken } from '@/src/shared/security/recaptchaService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgppcryxlyerofydivnq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const body = await req.json().catch(() => ({}));
    const { password, accessToken, code, recaptchaToken } = body;

    // 1. Verify Google reCAPTCHA
    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, 'reset_password', ip);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: recaptchaResult.error || 'Anti-bot verification failed.' },
        { status: 400 }
      );
    }

    // 2. Rate Limiting (max 5 attempts per 5 minutes)
    const rateLimit = checkRateLimit(`pwd_update_${ip}`, {
      maxAttempts: 5,
      windowMs: 5 * 60 * 1000,
      lockoutDurationMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.` },
        { status: 429 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 3. Password Complexity Verification
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasDigit || !hasSpecial) {
      return NextResponse.json(
        {
          error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        },
        { status: 400 }
      );
    }

    let updatedUser: any = null;

    // 4a. If PKCE exchange code is provided:
    if (code) {
      const cookieStore = await cookies();
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {}
          },
        },
      });

      const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        return NextResponse.json(
          { error: exchangeError.message || 'Invalid or expired password reset code.' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      updatedUser = data.user;
    }
    // 4b. If Access Token is provided:
    else if (accessToken) {
      const { data: userData, error: userError } = await adminSupabase.auth.getUser(accessToken);
      if (userError || !userData?.user) {
        return NextResponse.json(
          { error: userError?.message || 'Invalid or expired recovery access token.' },
          { status: 401 }
        );
      }

      const { data, error } = await adminSupabase.auth.admin.updateUserById(userData.user.id, { password });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      updatedUser = data.user;
    }
    // 4c. Check if an active session cookie or header exists:
    else {
      const cookieStore = await cookies();
      const authHeader = req.headers.get('authorization');
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {}
          },
        },
        global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
      });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        return NextResponse.json(
          { error: 'Password reset token or recovery code is missing, invalid, or expired. Please request a new password reset link.' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      updatedUser = data.user;
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Password reset token is missing, expired, or invalid. Please request a new link.' },
        { status: 400 }
      );
    }

    // 5. Record security audit log
    try {
      await adminSupabase.from('audit_logs').insert({
        id: `pwd-set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        actor_user_id: updatedUser.id || null,
        actor_name: updatedUser.email || 'User',
        actor_role: 'USER',
        action: 'AUTH_PASSWORD_RESET_COMPLETED',
        entity_type: 'USER_AUTHENTICATION',
        entity_id: updatedUser.id || 'unknown',
        ip_address: ip,
        details: `Password successfully reset using verified recovery credentials for ${updatedUser.email}.`,
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully updated. You may now sign in.',
    });
  } catch (error: any) {
    console.error('[POST /api/auth/reset-password]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while resetting your password.' },
      { status: 500 }
    );
  }
}
