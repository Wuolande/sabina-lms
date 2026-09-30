/**
 * API Route: POST /api/auth/forgot-password
 * -----------------------------------------------------------------------
 * Enterprise Password Recovery Endpoint.
 * Validates request, verifies Google reCAPTCHA, applies IP rate-limiting,
 * generates a reset link via Supabase admin API, and dispatches a branded
 * password reset email through the platform's configured SMTP provider.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';
import { adminSupabase } from '@/src/shared/database/supabase';
import { verifyRecaptchaToken } from '@/src/shared/security/recaptchaService';
import { dispatchEmail, getEmailProviderConfig } from '@/src/modules/communications/services/emailDispatcher';
import { renderBrandedEmailHtml } from '@/src/modules/communications/templates/emailTemplates';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const body = await req.json().catch(() => ({}));
    const { email, recaptchaToken } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify Google reCAPTCHA (if enabled in Admin Settings)
    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, 'forgot_password', ip);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: recaptchaResult.error || 'Anti-bot verification failed.' },
        { status: 400 }
      );
    }

    // 2. Enforce Rate Limiting (max 3 reset attempts per 5 minutes per IP or email)
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

    // 3. Silently check if user exists (always return success to prevent email enumeration)
    const { data: userCheck } = await adminSupabase
      .from('users')
      .select('id, display_name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userCheck) {
      // 4. Generate password reset link via Supabase admin API
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/$/, '');
      const { data: linkData, error: linkErr } = await adminSupabase.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
        options: {
          redirectTo: `${appUrl}/reset-password`,
        },
      });

      if (!linkErr && linkData?.properties?.action_link) {
        const resetLink = linkData.properties.action_link;
        const displayName = userCheck.display_name || normalizedEmail.split('@')[0];

        // 5. Fetch theme for branded email
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
          <h2 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#1e293b;">Reset your password</h2>
          <p style="color:#475569;margin:0 0 24px 0;font-size:15px;line-height:1.6;">
            Hello <strong>${displayName}</strong>, we received a request to reset the password for your Sabina LMS account.
          </p>
          <p style="text-align:center;margin:0 0 24px 0;">
            <a href="${resetLink}" style="display:inline-block;background:#14209C;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Reset My Password</a>
          </p>
          <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px;font-size:13px;color:#713f12;margin:0 0 24px 0;">
            ⚠️ This link expires in <strong>60 minutes</strong> and can only be used once. If you did not request a password reset, please ignore this email — your account remains secure.
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            If the button above doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetLink}" style="color:#3b82f6;word-break:break-all;">${resetLink}</a>
          </p>
        `;

        await dispatchEmail({
          to: normalizedEmail,
          subject: '🔒 Reset your Sabina LMS password',
          html: renderBrandedEmailHtml({
            title: 'Reset your Sabina LMS password',
            bodyHtml,
            logoUrl,
            primaryColor,
          }),
          fromName: emailConfig.fromName,
          fromEmail: emailConfig.fromEmail,
        });
      }
    }

    // 5. Record security audit log
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
