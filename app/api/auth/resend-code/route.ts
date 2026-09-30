/**
 * API Route: POST /api/auth/resend-code
 * -----------------------------------------------------------------------
 * Resends email confirmation OTP via the platform's SMTP dispatcher.
 * Uses Supabase admin generateLink() to get a fresh OTP, then sends a
 * branded confirmation email — completely bypassing Supabase's emailer.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';
import { dispatchEmail, getEmailProviderConfig } from '@/src/modules/communications/services/emailDispatcher';
import { renderBrandedEmailHtml } from '@/src/modules/communications/templates/emailTemplates';

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

    // Generate a fresh OTP via Supabase admin API and send via our SMTP dispatcher.
    // We use 'magiclink' type because 'signup' requires the original password which
    // is unavailable in the resend flow. The OTP it generates is valid for verifyOtp.
    const { data: linkData, error: linkErr } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
    });

    if (linkErr || !linkData?.properties?.email_otp) {
      // Fallback: try Supabase's own resend (may still use Supabase emailer)
      const { error: resendErr } = await adminSupabase.auth.resend({
        type: type as any,
        email: normalizedEmail,
      });

      if (resendErr) {
        return NextResponse.json(
          { error: resendErr.message || 'Failed to resend confirmation code.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'New confirmation code sent to your email address.',
      });
    }

    // Get user display name if available
    let displayName = normalizedEmail.split('@')[0];
    try {
      const { data: userRow } = await adminSupabase
        .from('users')
        .select('display_name')
        .eq('email', normalizedEmail)
        .maybeSingle();
      if (userRow?.display_name) displayName = userRow.display_name;
    } catch {}

    const otp = linkData.properties.email_otp;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/$/, '');
    // Use 'magiclink' type in the verify URL since we generated a magiclink OTP
    const verifyLink = `${appUrl}/verify-email?email=${encodeURIComponent(normalizedEmail)}&token=${otp}&type=magiclink`;

    // Fetch theme
    let primaryColor = '#14209C';
    let logoUrl = '';
    try {
      const { data: themeData } = await adminSupabase
        .from('platform_theme')
        .select('primary_color, logo_url')
        .eq('id', 'default')
        .single();
      if (themeData?.primary_color) primaryColor = themeData.primary_color;
      if (themeData?.logo_url) logoUrl = themeData.logo_url;
    } catch {}

    const emailConfig = await getEmailProviderConfig();

    const bodyHtml = `
      <h2 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#1e293b;">Your new confirmation code</h2>
      <p style="color:#475569;margin:0 0 24px 0;font-size:15px;line-height:1.6;">
        Hello <strong>${displayName}</strong>, here is your new 6-digit confirmation code:
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
      subject: '✉️ Your new Sabina LMS confirmation code',
      html: renderBrandedEmailHtml({
        title: 'New confirmation code',
        bodyHtml,
        logoUrl,
        primaryColor,
      }),
      fromName: emailConfig.fromName,
      fromEmail: emailConfig.fromEmail,
    });

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
