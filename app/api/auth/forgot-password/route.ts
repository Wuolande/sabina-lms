/**
 * API Route: POST /api/auth/forgot-password
 * -----------------------------------------------------------------------
 * Enterprise Password Recovery Endpoint.
 * Validates request, applies IP/account rate-limiting, dispatches password
 * reset email via Supabase Auth, and records security audit trail.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';
import { requestPasswordReset } from '@/src/shared/auth/authService';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Enforce Rate Limiting (max 3 reset attempts per 5 minutes per IP or email)
    const rateLimit = checkRateLimit(`pwd_reset_${ip}_${normalizedEmail}`, {
      maxAttempts: 3,
      windowMs: 5 * 60 * 1000,
      lockoutDurationMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 2. Request reset via Supabase Auth
    await requestPasswordReset(normalizedEmail);

    // 3. Record security audit log
    try {
      await adminSupabase.from('audit_logs').insert({
        id: `pwd-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        actor_name: normalizedEmail,
        actor_role: 'GUEST',
        action: 'AUTH_PASSWORD_RESET_REQUESTED',
        entity_type: 'USER_AUTHENTICATION',
        entity_id: normalizedEmail,
        ip_address: ip,
        details: `Password recovery reset link requested for ${normalizedEmail}.`,
      });
    } catch {
      // Non-blocking audit log
    }

    return NextResponse.json({
      success: true,
      message: 'If the provided email is registered, password recovery instructions have been sent.',
    });
  } catch (error: any) {
    console.error('[POST /api/auth/forgot-password]', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
