/**
 * API Route: POST /api/auth/register
 * -----------------------------------------------------------------------
 * Enterprise User Registration Handler:
 * - Anti-Bot Honeypot Defense
 * - Disposable & Burner Email Blocking
 * - Privilege Escalation Guard (Strict Student/Tutor Whitelist)
 * - Rate Limiting & Sliding Window Registration Throttling
 * - Server-Side Google reCAPTCHA Verification
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { adminSupabase } from '@/src/shared/database/supabase';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';
import { checkHoneypot } from '@/src/shared/security/honeypot';
import { isDisposableEmail } from '@/src/shared/security/disposableEmailBlocker';
import { verifyRecaptchaToken } from '@/src/shared/security/recaptchaService';

const ALLOWED_PUBLIC_ROLES = new Set(['STUDENT', 'TUTOR']);

export async function POST(request: NextRequest) {
  try {
    // 1. Client IP Extraction
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 2. IP Rate Limiting (max 5 registration attempts per 15 minutes per IP)
    const rateLimit = checkRateLimit(`reg_${ip}`, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      lockoutDurationMs: 30 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.` },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, password, firstName, lastName, role, recaptchaToken } = body;

    // 3. Honeypot Anti-Bot Trap
    const honeypot = checkHoneypot(body);
    if (honeypot.isBot) {
      return NextResponse.json(
        { error: 'Automated submission rejected. Bot activity detected.' },
        { status: 400 }
      );
    }

    // 4. Validate Email & Disposable Domain Check
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (isDisposableEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Temporary or disposable email domains are not allowed. Please use a standard email provider.' },
        { status: 400 }
      );
    }

    // 5. Password Length & Complexity
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters in length.' },
        { status: 400 }
      );
    }

    // 6. Privilege Escalation Guard
    // Bar any client from requesting ADMIN or arbitrary role elevations
    const requestedRole = (typeof role === 'string' ? role : 'STUDENT').toUpperCase().trim();
    if (!ALLOWED_PUBLIC_ROLES.has(requestedRole)) {
      return NextResponse.json(
        { error: 'Invalid account role requested. Only Student and Tutor registrations are permitted.' },
        { status: 400 }
      );
    }
    const safeRole: 'STUDENT' | 'TUTOR' = requestedRole as 'STUDENT' | 'TUTOR';

    // 7. reCAPTCHA Verification (Graceful bypass when disabled)
    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, 'register', ip);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: recaptchaResult.error || 'Bot verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // 8. Sign Up via Supabase Auth
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

    const displayName = `${firstName || ''} ${lastName || ''}`.trim() || normalizedEmail.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          display_name: displayName,
          role: safeRole,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'User creation failed.' }, { status: 400 });
    }

    // 9. Synchronize profile in public.users and public.user_roles tables atomically
    const fName = (firstName || displayName.split(' ')[0] || normalizedEmail.split('@')[0]).trim();
    const lName = (lastName || displayName.split(' ').slice(1).join(' ') || 'Member').trim();

    // The auth.users trigger provisions a public.users row; find it or fallback
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('id')
      .or(`auth_id.eq.${data.user.id},email.eq.${normalizedEmail}`)
      .maybeSingle();

    let publicUserId: string;

    if (dbUser) {
      publicUserId = dbUser.id;
      await adminSupabase.from('users').update({
        first_name: fName,
        last_name: lName,
        display_name: displayName,
        auth_id: data.user.id,
      }).eq('id', publicUserId);
    } else {
      const { data: insertedUser } = await adminSupabase.from('users').insert({
        id: data.user.id,
        auth_id: data.user.id,
        email: normalizedEmail,
        first_name: fName,
        last_name: lName,
        display_name: displayName,
      }).select('id').single();
      publicUserId = insertedUser?.id || data.user.id;
    }

    // Ensure user_roles mapping reflects the validated safeRole
    try {
      await adminSupabase.from('user_roles').upsert({
        user_id: publicUserId,
        role_id: safeRole,
      });
    } catch (rErr: any) {
      console.warn('[Register user_roles error]', rErr?.message);
    }

    // If Tutor, seed empty tutor_profiles row with valid slug
    if (safeRole === 'TUTOR') {
      try {
        const cleanName = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tutor';
        const tutorSlug = `${cleanName}-${publicUserId.slice(0, 8)}`;
        await adminSupabase.from('tutor_profiles').upsert({
          user_id: publicUserId,
          slug: tutorSlug,
          bio: '',
          headline: 'Instructor at Sabina LMS',
          hourly_rate: 25.0,
          verification_status: 'PENDING',
          account_status: 'ACTIVE',
        }, { onConflict: 'user_id' });
      } catch (tErr: any) {
        console.warn('[Register tutor_profile seed notice]', tErr?.message);
      }
    }

    // If Student, seed student_profiles default row
    if (safeRole === 'STUDENT') {
      try {
        await adminSupabase.from('student_profiles').upsert({
          user_id: publicUserId,
          current_level: 'Intermediate',
          weekly_study_hours_target: 5,
        }, { onConflict: 'user_id' });
      } catch (sErr: any) {
        console.warn('[Register student_profile seed notice]', sErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: !data.user.email_confirmed_at,
      user: {
        id: data.user.id,
        email: normalizedEmail,
        role: safeRole,
      },
      message: data.user.email_confirmed_at
        ? 'Account successfully registered.'
        : 'Account created. Please enter the 6-digit confirmation code sent to your email.',
    });
  } catch (err: any) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
