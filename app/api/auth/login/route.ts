/**
 * API Route: POST /api/auth/login
 * -----------------------------------------------------------------------
 * Enterprise Login Handler:
 * - Anti-Brute-Force Rate Limiting (5 attempts / 5 mins + 15 min lockout)
 * - Rate limit reset upon successful credentials verification
 * - Honeypot Anti-Bot Shield
 * - Server-Side Google reCAPTCHA Verification
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkRateLimit, resetRateLimit } from '@/src/shared/security/rateLimiter';
import { checkHoneypot } from '@/src/shared/security/honeypot';
import { verifyRecaptchaToken } from '@/src/shared/security/recaptchaService';

export async function POST(request: NextRequest) {
  try {
    // 1. Client IP Extraction
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const body = await request.json().catch(() => ({}));
    const { email, password, recaptchaToken } = body;

    // 2. Honeypot Anti-Bot Trap
    const honeypot = checkHoneypot(body);
    if (honeypot.isBot) {
      return NextResponse.json(
        { error: 'Automated login rejected. Bot activity detected.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rateLimitIdentifier = `login_${ip}_${normalizedEmail}`;

    // 3. Anti-Brute-Force Rate Limiter (Max 5 attempts before 15 min lockout)
    const rateLimit = checkRateLimit(rateLimitIdentifier, {
      maxAttempts: 5,
      windowMs: 5 * 60 * 1000,
      lockoutDurationMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Access is locked for ${rateLimit.retryAfterSeconds} seconds for your security.`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 4. reCAPTCHA Verification
    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, 'login', ip);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: recaptchaResult.error || 'Anti-bot verification failed.' },
        { status: 400 }
      );
    }

    // 5. Supabase Password Authentication
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // 6. Reset Rate Limiter on Successful Login
    resetRateLimit(rateLimitIdentifier);

    return NextResponse.json({ success: true, user: data.user, session: data.session });
  } catch (err: any) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
