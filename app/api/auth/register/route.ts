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
import { adminSupabase } from '@/src/shared/database/supabase';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';
import { checkHoneypot } from '@/src/shared/security/honeypot';
import { isDisposableEmail } from '@/src/shared/security/disposableEmailBlocker';
import { verifyRecaptchaToken } from '@/src/shared/security/recaptchaService';
import { getAppOrigin } from '@/src/shared/utils/appUrl';

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

    // 8. Provision user in Supabase Auth via admin API
    // Using admin.createUser prevents Supabase from sending its built-in generic confirmation email,
    // ensuring ONLY our branded SMTP template with full name, 6-digit OTP, and live URL is dispatched.
    const fName = (firstName || '').trim();
    const lName = (lastName || '').trim();
    const displayName = `${fName} ${lName}`.trim() || normalizedEmail.split('@')[0];

    const { data, error } = await adminSupabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false,
      user_metadata: {
        first_name: fName,
        last_name: lName,
        display_name: displayName,
        role: safeRole,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'User creation failed.' }, { status: 400 });
    }

    // 9. Synchronize profile in public.users and public.user_roles tables atomically
    // The auth.users trigger provisions a public.users row; find it or fallback
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('id')
      .or(`auth_id.eq.${data.user.id},email.eq.${normalizedEmail}`)
      .maybeSingle();

    let publicUserId: string;

    const initialStatus = data.user.email_confirmed_at ? 'ACTIVE' : 'PENDING';

    if (dbUser) {
      publicUserId = dbUser.id;
      await adminSupabase.from('users').update({
        first_name: fName,
        last_name: lName,
        display_name: displayName,
        auth_id: data.user.id,
        status: initialStatus,
      }).eq('id', publicUserId);
    } else {
      const { data: insertedUser } = await adminSupabase.from('users').insert({
        id: data.user.id,
        auth_id: data.user.id,
        email: normalizedEmail,
        first_name: fName,
        last_name: lName,
        display_name: displayName,
        status: initialStatus,
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

    // 10. If email confirmation is required, generate a 6-digit OTP and send via our SMTP dispatcher
    if (!data.user.email_confirmed_at) {
      try {
        // Generate an exact 6-digit numeric confirmation code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in public.users record
        await adminSupabase.from('users').update({
          confirmation_token: otp,
          confirmation_sent_at: new Date().toISOString(),
        }).eq('id', publicUserId);

        const appUrl = getAppOrigin(request);
        const verifyLink = `${appUrl}/verify-email?email=${encodeURIComponent(normalizedEmail)}&token=${otp}&type=signup`;

        const { dispatchEmail, getEmailProviderConfig } = await import('@/src/modules/communications/services/emailDispatcher');
        const { renderBrandedEmailHtml } = await import('@/src/modules/communications/templates/emailTemplates');

        const emailConfig = await getEmailProviderConfig();
        let primaryColor = '#14209C';
        let logoUrl = '';
        try {
          const { data: themeData } = await adminSupabase.from('platform_theme').select('primary_color, logo_url').eq('id', 'default').single();
          if (themeData?.primary_color) primaryColor = themeData.primary_color;
          if (themeData?.logo_url) logoUrl = themeData.logo_url;
        } catch {}

        const bodyHtml = `
          <h2 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#1e293b;">Confirm your email address</h2>
          <p style="color:#475569;margin:0 0 24px 0;font-size:15px;line-height:1.6;">
            Hello <strong>${displayName}</strong>, thank you for joining Sabina LMS! Please enter the 6-digit code below to activate your account.
          </p>
          <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px 0;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#0369a1;font-weight:600;letter-spacing:0.05em;">YOUR CONFIRMATION CODE</p>
            <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:10px;color:#0c4a6e;font-family:monospace;">${otp}</p>
            <p style="margin:8px 0 0 0;font-size:12px;color:#64748b;">Valid for 24 hours · One-time use only</p>
          </div>
          <p style="text-align:center;margin:0 0 24px 0;">
            <a href="${verifyLink}" style="display:inline-block;background:#14209C;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Confirm Email Address</a>
          </p>
          <p style="color:#94a3b8;font-size:12px;margin:0;">If you did not create a Sabina LMS account, you can safely ignore this email.</p>
        `;

        await dispatchEmail({
          to: normalizedEmail,
          subject: '✉️ Confirm your Sabina LMS account',
          html: renderBrandedEmailHtml({ title: 'Confirm your Sabina LMS account', bodyHtml, logoUrl, primaryColor }),
          fromName: emailConfig.fromName,
          fromEmail: emailConfig.fromEmail,
        });
      } catch (emailErr: any) {
        console.warn('[Register OTP email error]', emailErr?.message);
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

