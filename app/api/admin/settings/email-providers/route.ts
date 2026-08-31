/**
 * API Route: GET & PUT /api/admin/settings/email-providers
 * -----------------------------------------------------------------------
 * Manages email provider credentials (Resend, SendGrid, SES, SMTP, Postmark)
 * and deliverability policies.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAdminContext } from '@/src/shared/auth/authService';
import {
  EmailProviderConfig,
  DEFAULT_EMAIL_PROVIDER_CONFIG,
} from '@/src/modules/communications/types/emailProviderTypes';
import { clearEmailProviderConfigCache } from '@/src/modules/communications/services/emailDispatcher';

export async function GET(req: NextRequest) {
  try {
    await getAdminContext(req);

    const { data, error } = await adminSupabase
      .from('platform_policy_settings')
      .select('email_provider_config')
      .eq('id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('[GET /api/admin/settings/email-providers]', error.message);
    }

    const merged: EmailProviderConfig = {
      ...DEFAULT_EMAIL_PROVIDER_CONFIG,
      ...(data?.email_provider_config || {}),
    };

    // Mask secret keys for safe rendering in client UI
    const maskKey = (key?: string) => {
      if (!key) return '';
      if (key.length <= 8) return '••••••••';
      return `${key.substring(0, 4)}••••••••${key.slice(-4)}`;
    };

    return NextResponse.json({
      ...merged,
      resendApiKeyMasked: maskKey(merged.resendApiKey),
      sendgridApiKeyMasked: maskKey(merged.sendgridApiKey),
      sesSecretAccessKeyMasked: maskKey(merged.sesSecretAccessKey),
      postmarkServerTokenMasked: maskKey(merged.postmarkServerToken),
      mailgunApiKeyMasked: maskKey(merged.mailgunApiKey),
      smtpPasswordMasked: maskKey(merged.smtpPassword),
    });
  } catch (error: any) {
    console.error('[GET /api/admin/settings/email-providers]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    const body = await req.json();

    // Fetch existing configuration to preserve unchanged masked keys
    const { data: existingData } = await adminSupabase
      .from('platform_policy_settings')
      .select('email_provider_config')
      .eq('id', 'default')
      .single();

    const current = existingData?.email_provider_config || DEFAULT_EMAIL_PROVIDER_CONFIG;

    const unmaskOrKeep = (incoming?: string, original?: string) => {
      if (!incoming || incoming.includes('••••')) return original || '';
      return incoming;
    };

    const updatedConfig: EmailProviderConfig = {
      ...DEFAULT_EMAIL_PROVIDER_CONFIG,
      ...body,
      resendApiKey: unmaskOrKeep(body.resendApiKey, current.resendApiKey),
      sendgridApiKey: unmaskOrKeep(body.sendgridApiKey, current.sendgridApiKey),
      sesSecretAccessKey: unmaskOrKeep(body.sesSecretAccessKey, current.sesSecretAccessKey),
      postmarkServerToken: unmaskOrKeep(body.postmarkServerToken, current.postmarkServerToken),
      mailgunApiKey: unmaskOrKeep(body.mailgunApiKey, current.mailgunApiKey),
      smtpPassword: unmaskOrKeep(body.smtpPassword, current.smtpPassword),
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email || 'Admin',
    };

    const { error } = await adminSupabase
      .from('platform_policy_settings')
      .upsert({
        id: 'default',
        email_provider_config: updatedConfig,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(error.message);
    }

    // Invalidate dispatcher cache
    clearEmailProviderConfigCache();

    // Record audit log
    await adminSupabase.from('audit_logs').insert({
      actor_user_id: admin.id,
      action: 'UPDATE_EMAIL_PROVIDER_CONFIG',
      entity_type: 'EMAIL_PROVIDER',
      entity_id: 'default',
      metadata: {
        activeProvider: updatedConfig.activeProvider,
        fromEmail: updatedConfig.fromEmail,
        fromName: updatedConfig.fromName,
      },
    });

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error: any) {
    console.error('[PUT /api/admin/settings/email-providers]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
