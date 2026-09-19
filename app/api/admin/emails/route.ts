/**
 * API Route: /api/admin/emails
 * -----------------------------------------------------------------------
 * Enterprise Admin Communications & Email Broadcast Hub.
 * GET: Retrieves all dispatched communications & broadcast history from audit trail.
 * POST: Dispatches direct or bulk broadcast emails and logs the dispatch event.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/src/shared/auth/authService';
import { adminSupabase } from '@/src/shared/database/supabase';
import { EmailLogRecord, SendEmailPayload } from '@/src/modules/communications/types/emailTypes';
import { dispatchEmail } from '@/src/modules/communications/services/emailDispatcher';
import { renderBrandedEmailHtml, formatEmailBodyHtml } from '@/src/modules/communications/templates/emailTemplates';

export async function GET(req: NextRequest) {
  try {
    await getAdminContext(req);

    // Query all communications from audit_logs
    const { data, error } = await adminSupabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'ADMIN_COMMUNICATION')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('[GET /api/admin/emails]', error.message);
      return NextResponse.json({ data: [], total: 0 });
    }

    const logs: EmailLogRecord[] = (data || []).map((row: any) => {
      const meta = row.metadata || {};
      return {
        id: row.id,
        audience: meta.audience || 'ALL_USERS',
        recipientEmail: meta.recipientEmail,
        recipientCount: meta.recipientCount ?? 1,
        templateType: meta.templateType || 'CUSTOM',
        subject: meta.subject || row.action || 'System Email',
        contentSnippet: row.details || '',
        senderName: row.actor_name || 'Admin',
        status: 'DELIVERED',
        sentAt: row.created_at,
      };
    });

    return NextResponse.json({
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/emails]', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    const body: SendEmailPayload = await req.json();

    if (!body.subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required.' }, { status: 400 });
    }
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Email content is required.' }, { status: 400 });
    }

    // Determine recipients based on selected audience
    let recipients: string[] = [];
    if (body.audience === 'SINGLE_USER') {
      if (body.recipientEmail?.includes('@')) {
        recipients = [body.recipientEmail.trim().toLowerCase()];
      }
    } else if (body.audience === 'ALL_STUDENTS') {
      const { data: students } = await adminSupabase
        .from('users')
        .select('email')
        .eq('role', 'STUDENT')
        .limit(500);
      recipients = (students || []).map((u: any) => u.email).filter(Boolean);
    } else if (body.audience === 'ALL_TUTORS') {
      const { data: tutors } = await adminSupabase
        .from('users')
        .select('email')
        .eq('role', 'TUTOR')
        .limit(500);
      recipients = (tutors || []).map((u: any) => u.email).filter(Boolean);
    } else if (body.audience === 'ALL_USERS') {
      const { data: allUsers } = await adminSupabase
        .from('users')
        .select('email')
        .limit(1000);
      recipients = (allUsers || []).map((u: any) => u.email).filter(Boolean);
    }

    const recipientCount = recipients.length || 1;

    // Fetch platform branding (logo & primary color)
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

    // Render RFC-compliant, responsive HTML with platform logo
    const formattedContent = formatEmailBodyHtml(body.content);
    const brandedHtml = renderBrandedEmailHtml({
      title: body.subject,
      bodyHtml: formattedContent,
      logoUrl,
      primaryColor,
    });

    // Real dispatch through active provider
    let dispatchSuccess = true;
    let dispatchError: string | undefined;

    if (recipients.length > 0) {
      const dispatchRes = await dispatchEmail({
        to: recipients,
        subject: body.subject,
        html: brandedHtml,
        text: body.content,
        fromName: body.senderName || admin.displayName || 'Sabina LMS Operations',
      });
      dispatchSuccess = dispatchRes.success;
      dispatchError = dispatchRes.error;
    }

    const logId = `eml-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const status = dispatchSuccess ? 'DELIVERED' : 'FAILED';

    // Record email dispatch in audit logs
    const { error: insertErr } = await adminSupabase.from('audit_logs').insert({
      id: logId,
      actor_user_id: admin.id,
      actor_name: admin.displayName || 'Administrator',
      actor_role: 'ADMIN',
      action: `EMAIL_BROADCAST_${body.templateType}`,
      entity_type: 'ADMIN_COMMUNICATION',
      entity_id: body.audience === 'SINGLE_USER' ? (body.recipientEmail || 'user') : body.audience,
      details: body.content.substring(0, 300) + (body.content.length > 300 ? '...' : ''),
      metadata: {
        audience: body.audience,
        recipientEmail: body.recipientEmail,
        recipientCount,
        templateType: body.templateType,
        subject: body.subject,
        fullContent: body.content,
        status,
        error: dispatchError || null,
      },
    });

    if (insertErr) {
      console.warn('[POST /api/admin/emails audit insert error]', insertErr.message);
    }

    if (!dispatchSuccess && dispatchError) {
      return NextResponse.json({
        success: false,
        error: `Failed to dispatch email: ${dispatchError}`,
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: `Email successfully dispatched to ${recipientCount} recipient(s).`,
      record: {
        id: logId,
        audience: body.audience,
        recipientEmail: body.recipientEmail,
        recipientCount,
        templateType: body.templateType,
        subject: body.subject,
        contentSnippet: body.content.substring(0, 200),
        senderName: admin.displayName,
        status,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[POST /api/admin/emails]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch email.' },
      { status: error.statusCode || 500 }
    );
  }
}
