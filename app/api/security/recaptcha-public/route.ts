/**
 * Public Security Info Endpoint
 * -----------------------------------------------------------------------
 * Exposes ONLY the public reCAPTCHA site key and status to frontend forms.
 * -----------------------------------------------------------------------
 */

import { NextResponse } from 'next/server';
import { getSecuritySettings } from '@/src/shared/security/recaptchaService';

export async function GET() {
  try {
    const settings = await getSecuritySettings();
    return NextResponse.json({
      enabled: settings.recaptchaEnabled,
      version: settings.recaptchaVersion,
      siteKey: settings.recaptchaSiteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
      protectedForms: settings.protectedForms,
    });
  } catch (error: any) {
    return NextResponse.json({
      enabled: false,
      siteKey: '',
    });
  }
}
