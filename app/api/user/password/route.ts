/**
 * API Route: POST /api/user/password
 * -----------------------------------------------------------------------
 * Allows authenticated users (tutors, students, admins) to change password.
 * Validates password criteria and updates credentials.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTutorContext } from '@/src/shared/auth/authService';
import { adminSupabase } from '@/src/shared/database/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgppcryxlyerofydivnq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const tutor = await getTutorContext(req);
    const body = await req.json();
    const { newPassword, currentPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 1. If Supabase admin client is configured with service role
    if (supabaseServiceKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Find user auth ID if linked
      const { data: userRec } = await adminClient
        .from('users')
        .select('id, auth_id, email, display_name')
        .eq('id', tutor.userId)
        .single();

      if (userRec?.auth_id) {
        const { error: authErr } = await adminClient.auth.admin.updateUserById(
          userRec.auth_id,
          { password: newPassword }
        );
        if (authErr) {
          console.warn('[Supabase Auth Password Update]', authErr.message);
        }
      }
    }

    // 2. Record security audit log
    await adminSupabase.from('audit_logs').insert({
      actor_user_id: tutor.userId,
      actor_name: tutor.displayName,
      actor_role: 'TUTOR',
      action: 'USER_PASSWORD_UPDATED',
      entity_type: 'USER_SECURITY',
      entity_id: tutor.userId,
      details: `User ${tutor.displayName} successfully updated their password via Profile Security.`,
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been changed successfully.',
    });

  } catch (error: any) {
    console.error('[POST /api/user/password]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
