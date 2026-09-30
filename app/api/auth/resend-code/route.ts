/**
 * API Route: POST /api/auth/resend-code
 * -----------------------------------------------------------------------
 * Resends 6-digit email confirmation OTP via the platform's SMTP dispatcher.
 * Saves the 6-digit OTP directly to users.confirmation_token and dispatches
 * a branded email with dynamic origin URL.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';
import { dispatchEmail, getEmailProviderConfig } from '@/src/modules/communications/services/emailDispatcher';
import { renderBrandedEmailHtml } from '@/src/modules/communications/templates/emailTemplates';
import { getAppOrigin } from '@/src/shared/utils/appUrl';

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

    // Generate a fresh exact 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in public.users record
    const { data: userRow, error: updateErr } = await adminSupabase
      .from('users')
      .update({
        confirmation_token: otp,
        confirmation_sent_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail)
      .select('display_name')
      .maybeSingle();

    if (updateErr) {
      console.warn('[resend-code update users error]', updateErr.message);
    }

    const displayName = userRow?.display_name || normalizedEmail.split('@')[0];
    const appUrl = getAppOrigin(request);
    const verifyLink = `${appUrl}/verify-email?email=${encodeURIComponent(normalizedEmail)}&token=${otp}&type=${type}`;

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
      <p style="color:#94a3b8;font-size:12px;margin:0;">If you did not request this, you can safely ignore this email.</p>
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
