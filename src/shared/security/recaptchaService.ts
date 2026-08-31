/**
 * Google reCAPTCHA Verification Service
 * -----------------------------------------------------------------------
 * Server-side validation for reCAPTCHA v3 & v2 tokens.
 * Gracefully bypasses validation when reCAPTCHA is toggled OFF in Admin Settings.
 * -----------------------------------------------------------------------
 */

import { adminSupabase } from '@/src/shared/database/supabase';
import { SecuritySettings, DEFAULT_SECURITY_SETTINGS } from './securityTypes';

let cachedSecuritySettings: { data: SecuritySettings; expiresAt: number } | null = null;

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const now = Date.now();
  if (cachedSecuritySettings && cachedSecuritySettings.expiresAt > now) {
    return cachedSecuritySettings.data;
  }

  try {
    const { data, error } = await adminSupabase
      .from('platform_policy_settings')
      .select('security_config')
      .eq('id', 'default')
      .single();

    if (!error && data?.security_config) {
      const merged: SecuritySettings = {
        ...DEFAULT_SECURITY_SETTINGS,
        ...data.security_config,
      };
      cachedSecuritySettings = { data: merged, expiresAt: now + 30_000 }; // 30s cache
      return merged;
    }
  } catch (err) {
    console.error('[getSecuritySettings] Error reading settings from DB:', err);
  }

  // Fallback to environment variables or defaults
  const envSettings: SecuritySettings = {
    ...DEFAULT_SECURITY_SETTINGS,
    recaptchaEnabled: process.env.NEXT_PUBLIC_RECAPTCHA_ENABLED === 'true' || false,
    recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
    recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || '',
  };
  cachedSecuritySettings = { data: envSettings, expiresAt: now + 10_000 };
  return envSettings;
}

export function clearSecuritySettingsCache() {
  cachedSecuritySettings = null;
}

export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  bypassed?: boolean;
  error?: string;
  errorCodes?: string[];
}

/**
 * Validates a client-submitted reCAPTCHA token against Google's API.
 */
export async function verifyRecaptchaToken(
  token: string | undefined | null,
  expectedAction?: string,
  clientIp?: string
): Promise<RecaptchaVerificationResult> {
  const settings = await getSecuritySettings();

  // If reCAPTCHA is disabled in Admin Settings, allow the request immediately
  if (!settings.recaptchaEnabled) {
    return { success: true, bypassed: true, score: 1.0 };
  }

  const secretKey = settings.recaptchaSecretKey || process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn('[reCAPTCHA] reCAPTCHA is enabled but no secret key is configured. Allowing request in dev mode.');
    return { success: true, bypassed: true, score: 1.0 };
  }

  if (!token) {
    return {
      success: false,
      error: 'Bot verification token is missing. Please complete the security check.',
    };
  }

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });
    if (clientIp) {
      params.append('remoteip', clientIp);
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Google reCAPTCHA verification service returned HTTP ${response.status}`,
      };
    }

    const json = await response.json();

    if (!json.success) {
      return {
        success: false,
        errorCodes: json['error-codes'] || [],
        error: 'reCAPTCHA verification failed. Bot activity detected.',
      };
    }

    // For reCAPTCHA v3, validate score threshold
    if (typeof json.score === 'number') {
      const minScore = settings.recaptchaMinScore ?? 0.5;
      if (json.score < minScore) {
        return {
          success: false,
          score: json.score,
          action: json.action,
          error: `Security risk detected (Bot score: ${json.score.toFixed(2)} / Minimum required: ${minScore}).`,
        };
      }
    }

    // Check expected action if provided
    if (expectedAction && json.action && json.action !== expectedAction) {
      console.warn(`[reCAPTCHA] Action mismatch: expected "${expectedAction}", got "${json.action}"`);
    }

    return {
      success: true,
      score: json.score,
      action: json.action,
    };
  } catch (err: any) {
    console.error('[reCAPTCHA Service Error]', err);
    // In production fail securely, in dev allow with warning
    return {
      success: process.env.NODE_ENV !== 'production',
      error: 'Failed to connect to Google reCAPTCHA verification service.',
    };
  }
}
