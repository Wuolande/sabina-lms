import { NextResponse } from 'next/server';
import { ENTERPRISE_EMAIL_TEMPLATES } from '@/src/modules/communications/templates/emailTemplates';

export async function GET() {
  return NextResponse.json({
    templates: ENTERPRISE_EMAIL_TEMPLATES,
  });
}
