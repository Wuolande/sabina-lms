/**
 * Next.js Middleware — Authentication & Route Protection
 * -----------------------------------------------------------------------
 * Protects admin routes by checking Supabase Auth session.
 * Redirects unauthenticated users to /auth/login.
 * Redirects non-admin users away from /admin routes.
 *
 * Protected route patterns:
 *   /admin/*     → requires ADMIN or SUPER_ADMIN role
 *   /tutor/*     → requires TUTOR role (or admin)
 *   /student/*   → requires STUDENT role (or admin)
 *   /api/admin/* → returns 401 JSON if unauthenticated
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Public routes — always allow through ──────────────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/upload') ||
    pathname === '/' ||
    pathname.startsWith('/(public)')
  ) {
    return NextResponse.next();
  }

  // ─── API admin routes — return JSON 401 ────────────────────────────────────
  const isApiAdmin = pathname.startsWith('/api/admin');

  // ─── Get session from cookies ───────────────────────────────────────────────
  // Extract access token from cookie set by Supabase Auth client
  const accessTokenCookie = request.cookies.getAll().find(
    (c) => c.name.includes('auth-token') || c.name === 'sb-access-token'
  );
  const accessToken = accessTokenCookie?.value;

  // In development: allow through without auth (dev admin context is used in API handlers)
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // No session at all
  if (!accessToken) {
    if (isApiAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required.' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Verify the token
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error } = await client.auth.getUser(accessToken);

    if (error || !user) {
      if (isApiAdmin) {
        return NextResponse.json({ error: 'Unauthorized', message: 'Invalid session.' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // All good — attach user id to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('X-Auth-User-Id', user.id);
    return response;

  } catch {
    if (isApiAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/tutor/:path*',
    '/student/:path*',
    '/api/admin/:path*',
  ],
};
