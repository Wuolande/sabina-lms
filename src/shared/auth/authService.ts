/**
 * Authentication & Session Management Module
 * -----------------------------------------------------------------------
 * Supabase Auth wrapper providing:
 *  - Session token verification (JWT) via @supabase/ssr
 *  - Role-based UserContext extraction for API routes
 * -----------------------------------------------------------------------
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { UserContext } from '../permissions/rbac';
import { UnauthorizedError } from '../errors';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface SignUpPayload {
  email: string;
  password: string;
  displayName: string;
  role?: 'STUDENT' | 'TUTOR';
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export async function signUp(payload: SignUpPayload): Promise<AuthResult> {
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await client.auth.signUp({
    email: payload.email.trim(),
    password: payload.password,
    options: {
      data: {
        display_name: payload.displayName.trim(),
        role: payload.role || 'STUDENT',
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, userId: data.user?.id };
}

export async function signIn(payload: SignInPayload): Promise<AuthResult> {
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await client.auth.signInWithPassword({
    email: payload.email.trim(),
    password: payload.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, userId: data.user?.id };
}

export async function signOut(): Promise<void> {
  const client = createClient(supabaseUrl, supabaseAnonKey);
  await client.auth.signOut();
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await client.auth.updateUser({ password: newPassword });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignored if called from a Server Component
        }
      },
    },
  });
}

/**
 * Extracts the admin UserContext from an incoming Next.js API route request.
 */
export async function getAdminContext(request: NextRequest): Promise<UserContext> {
  try {
    const supabase = await getServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new UnauthorizedError();
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('users')
      .select('id, email, display_name, roles:user_roles!user_roles_user_id_fkey(role_id)')
      .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedError();
    }

    const roles = (profile.roles as { role_id: string }[]).map((r) => r.role_id) as any[];

    return {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      roles,
    };
  } catch {
    throw new UnauthorizedError();
  }
}

/**
 * Extracts the current student's User ID from session (or impersonation cookie).
 */
export async function getStudentContext(request: NextRequest): Promise<{ userId: string; email: string; displayName: string }> {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    // ── IMPERSONATION CHECK ──
    const impersonateCookie = request.cookies.get('sb-impersonate');
    if (impersonateCookie) {
      // 1. Verify the current real user is an Admin
      const { data: realProfile } = await adminSupabase
        .from('users')
        .select('id, roles:user_roles!user_roles_user_id_fkey(role_id)')
        .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
        .single();

      if (realProfile) {
        const roles = (realProfile.roles as any[]).map(r => r.role_id);
        if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
          // 2. Fetch the target student's profile
          const targetUserId = impersonateCookie.value;
          const { data: targetProfile } = await adminSupabase
            .from('users')
            .select('id, email, display_name')
            .eq('id', targetUserId)
            .single();

          if (targetProfile) {
            return { userId: targetProfile.id, email: targetProfile.email, displayName: targetProfile.display_name };
          }
        }
      }
    }
    // ── END IMPERSONATION CHECK ──

    const { data: profile } = await adminSupabase
      .from('users')
      .select('id, email, display_name')
      .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
      .single();

    if (!profile) throw new UnauthorizedError();

    return { userId: profile.id, email: profile.email, displayName: profile.display_name };
  } catch {
    throw new UnauthorizedError();
  }
}

/**
 * Extracts the current tutor's Profile ID from session (or impersonation cookie).
 */
export async function getTutorContext(request: NextRequest): Promise<{ tutorProfileId: string; userId: string; displayName: string }> {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    // ── IMPERSONATION CHECK ──
    const impersonateCookie = request.cookies.get('sb-impersonate');
    if (impersonateCookie) {
      // 1. Verify the current real user is an Admin
      const { data: realProfile } = await adminSupabase
        .from('users')
        .select('id, roles:user_roles!user_roles_user_id_fkey(role_id)')
        .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
        .single();

      if (realProfile) {
        const roles = (realProfile.roles as any[]).map(r => r.role_id);
        if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
          // 2. Fetch the target tutor's profile
          const targetUserId = impersonateCookie.value;
          const { data: targetProfile } = await adminSupabase
            .from('users')
            .select('id, display_name, tutor:tutor_profiles!tutor_profiles_user_id_fkey(id)')
            .eq('id', targetUserId)
            .single();

          const tutorData = targetProfile ? (Array.isArray((targetProfile as any).tutor) ? (targetProfile as any).tutor[0] : (targetProfile as any).tutor) : null;

          if (targetProfile && tutorData?.id) {
            return {
              tutorProfileId: tutorData.id,
              userId: targetProfile.id,
              displayName: targetProfile.display_name,
            };
          }
        }
      }
    }
    // ── END IMPERSONATION CHECK ──

    const { data: profile } = await adminSupabase
      .from('users')
      .select('id, display_name, tutor:tutor_profiles!tutor_profiles_user_id_fkey(id)')
      .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
      .single();

    const tutorData = profile ? (Array.isArray((profile as any).tutor) ? (profile as any).tutor[0] : (profile as any).tutor) : null;

    if (!profile || !tutorData?.id) {
      throw new UnauthorizedError();
    }

    return {
      tutorProfileId: tutorData.id,
      userId: profile.id,
      displayName: profile.display_name,
    };
  } catch {
    throw new UnauthorizedError();
  }
}

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

export async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const ctx = await getAdminContext(request);
    return ctx.roles.includes('ADMIN' as any) || ctx.roles.includes('SUPER_ADMIN' as any);
  } catch {
    return false;
  }
}
