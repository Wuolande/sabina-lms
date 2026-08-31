/**
 * API Route: POST /api/admin/settings/email-providers/test
 * -----------------------------------------------------------------------
 * Sends a real test email through the active/selected provider with diagnostics.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/src/shared/auth/authService';
import { sendLiveTestEmail } from '@/src/modules/communications/services/emailDispatcher';
import { EmailProviderType } from '@/src/modules/communications/types/emailProviderTypes';

export async function POST(req: NextRequest) {
  try {
    await getAdminContext(req);
    const body = await req.json();

    const recipientEmail = body.recipientEmail;
    if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid recipient email address for testing.' },
        { status: 400 }
      );
    }

    const providerOverride = body.provider as EmailProviderType | undefined;
    const result = await sendLiveTestEmail(recipientEmail, providerOverride);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[POST /api/admin/settings/email-providers/test]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch test email.' },
      { status: error.statusCode || 500 }
    );
  }
}
