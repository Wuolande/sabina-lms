/**
 * API Route: POST /api/auth/resend-code
 * -----------------------------------------------------------------------
 * Resends email confirmation code (OTP) or magic link to user.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const body = await request.json().catch(() => ({}));
    const { email, type = 'signup' } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit resend requests (max 3 resends per 5 minutes per IP + email)
    const rateLimit = checkRateLimit(`resend_${ip}_${normalizedEmail}`, {
      maxAttempts: 3,
      windowMs: 5 * 60 * 1000,
      lockoutDurationMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Please wait ${rateLimit.retryAfterSeconds} seconds before requesting another code.`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const { error } = await adminSupabase.auth.resend({
      type: type as any,
      email: normalizedEmail,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to resend confirmation code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'New confirmation code sent to your email address.',
    });
  } catch (err: any) {
    console.error('[POST /api/auth/resend-code]', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
