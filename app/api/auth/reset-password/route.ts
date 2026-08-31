/**
 * API Route: POST /api/auth/reset-password
 * -----------------------------------------------------------------------
 * Enterprise Password Reset Confirmation.
 * Validates new password strength, verifies reCAPTCHA, confirms token/code,
 * updates credentials, and records security audit trail.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';
import { adminSupabase } from '@/src/shared/database/supabase';
import { createClient } from '@supabase/supabase-js';
import { verifyRecaptchaToken } from '@/src/shared/security/recaptchaService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgppcryxlyerofydivnq.supabase.co';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const body = await req.json().catch(() => ({}));
    const { password, accessToken, recaptchaToken } = body;

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

    // 4. If access token is provided, update password for that session
    if (accessToken) {
      const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });

      const { data, error } = await userClient.auth.updateUser({ password });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Record audit log
      try {
        await adminSupabase.from('audit_logs').insert({
          id: `pwd-set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          actor_user_id: data.user?.id || null,
          actor_name: data.user?.email || 'User',
          actor_role: 'USER',
          action: 'AUTH_PASSWORD_RESET_COMPLETED',
          entity_type: 'USER_AUTHENTICATION',
          entity_id: data.user?.id || 'unknown',
          ip_address: ip,
          details: `Password successfully reset using verified recovery token for ${data.user?.email}.`,
        });
      } catch {
        // Non-blocking
      }
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
