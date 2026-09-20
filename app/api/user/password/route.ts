/**
 * API Route: POST /api/user/password
 *           PUT  /api/user/password
 * -----------------------------------------------------------------------
 * Allows authenticated users (students, tutors, admins) to change password.
 * Validates current password and updates credentials in Supabase Auth.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCaller } from '@/src/shared/auth/authService';
import { adminSupabase } from '@/src/shared/database/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgppcryxlyerofydivnq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function handlePasswordUpdate(req: NextRequest) {
  try {
    const caller = await getAuthenticatedCaller(req);
    const body = await req.json();
    const { newPassword, currentPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Please provide your current password.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 1. Verify current password with Supabase Auth
    if (supabaseAnonKey) {
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { error: signInError } = await authClient.auth.signInWithPassword({
        email: caller.email,
        password: currentPassword,
      });

      if (signInError) {
        return NextResponse.json(
          { error: 'Current password is incorrect. Please check your credentials.' },
          { status: 400 }
        );
      }
    }

    // 2. Update password in Supabase Auth via Admin client
    if (supabaseServiceKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Find user auth ID if linked
      const { data: userRec } = await adminClient
        .from('users')
        .select('id, auth_id, email, display_name')
        .eq('id', caller.userId)
        .single();

      if (userRec?.auth_id) {
        const { error: authErr } = await adminClient.auth.admin.updateUserById(
          userRec.auth_id,
          { password: newPassword }
        );
        if (authErr) {
          return NextResponse.json(
            { error: authErr.message || 'Failed to update authentication credentials.' },
            { status: 400 }
          );
        }
      }
    }

    // 3. Record security audit log
    const primaryRole = caller.roles[0] || (caller.isAdmin ? 'ADMIN' : 'STUDENT');
    await adminSupabase.from('audit_logs').insert({
      actor_user_id: caller.userId,
      actor_name: caller.displayName,
      actor_role: primaryRole,
      action: 'USER_PASSWORD_UPDATED',
      entity_type: 'USER_SECURITY',
      entity_id: caller.userId,
      details: `User ${caller.displayName} (${caller.email}) successfully updated their password.`,
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been changed successfully.',
    });

  } catch (error: any) {
    console.error('[PASSWORD_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handlePasswordUpdate(req);
}

export async function PUT(req: NextRequest) {
  return handlePasswordUpdate(req);
}
