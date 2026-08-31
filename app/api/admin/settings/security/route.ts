/**
 * API Route: GET & PUT /api/admin/settings/security
 * -----------------------------------------------------------------------
 * Manages Google reCAPTCHA v2/v3, brute-force defense, rate limiting,
 * and anti-abuse platform settings.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAdminContext } from '@/src/shared/auth/authService';
import {
  SecuritySettings,
  DEFAULT_SECURITY_SETTINGS,
} from '@/src/shared/security/securityTypes';
import { clearSecuritySettingsCache } from '@/src/shared/security/recaptchaService';

export async function GET(req: NextRequest) {
  try {
    await getAdminContext(req);

    const { data, error } = await adminSupabase
      .from('platform_policy_settings')
      .select('security_config')
      .eq('id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('[GET /api/admin/settings/security]', error.message);
    }

    const merged: SecuritySettings = {
      ...DEFAULT_SECURITY_SETTINGS,
      ...(data?.security_config || {}),
    };

    // Mask secret key for security display in UI
    const maskedSecret = merged.recaptchaSecretKey
      ? merged.recaptchaSecretKey.length > 8
        ? `${merged.recaptchaSecretKey.substring(0, 4)}••••••••${merged.recaptchaSecretKey.slice(-4)}`
        : '••••••••'
      : '';

    return NextResponse.json({
      ...merged,
      recaptchaSecretKeyMasked: maskedSecret,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/settings/security]', error);
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

    // Fetch existing settings to preserve secret key if not modified
    const { data: existingData } = await adminSupabase
      .from('platform_policy_settings')
      .select('security_config')
      .eq('id', 'default')
      .single();

    const currentConfig = existingData?.security_config || DEFAULT_SECURITY_SETTINGS;

    let finalSecretKey = body.recaptchaSecretKey;
    // If the client sent a masked placeholder or empty string and already had a key, preserve it
    if (!finalSecretKey || finalSecretKey.includes('••••')) {
      finalSecretKey = currentConfig.recaptchaSecretKey || '';
    }

    const updatedConfig: SecuritySettings = {
      ...DEFAULT_SECURITY_SETTINGS,
      ...body,
      recaptchaSecretKey: finalSecretKey,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email || 'Admin',
    };

    const { error } = await adminSupabase
      .from('platform_policy_settings')
      .upsert({
        id: 'default',
        security_config: updatedConfig,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(error.message);
    }

    // Clear server in-memory cache
    clearSecuritySettingsCache();

    // Record audit log
    await adminSupabase.from('audit_logs').insert({
      actor_user_id: admin.id,
      action: 'UPDATE_SECURITY_SETTINGS',
      entity_type: 'PLATFORM_SECURITY',
      entity_id: 'default',
      metadata: {
        recaptchaEnabled: updatedConfig.recaptchaEnabled,
        recaptchaVersion: updatedConfig.recaptchaVersion,
        rateLimitingEnabled: updatedConfig.rateLimitingEnabled,
        antiSpamChatFilter: updatedConfig.antiSpamChatFilter,
      },
    });

    return NextResponse.json({ success: true, settings: updatedConfig });
  } catch (error: any) {
    console.error('[PUT /api/admin/settings/security]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
