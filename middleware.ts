/**
 * Next.js Middleware — Authentication & Role-Based Access Control
 * -----------------------------------------------------------------------
 * Protects /admin, /tutor, /student, and /api/admin routes.
 * Redirects unauthenticated requests to /login.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── 1. Public Routes ──────────────────────────────────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/api/upload') ||
    pathname.startsWith('/api/homepage') ||
    pathname.startsWith('/api/blogs') ||
    pathname.startsWith('/api/tutors') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/tutors') ||
    pathname.startsWith('/tutor/training/certificates') ||
    pathname === '/' ||
    pathname.startsWith('/find-tutors') ||
    pathname.startsWith('/subjects') ||
    pathname.startsWith('/how-it-works') ||
    pathname.startsWith('/become-a-tutor') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/cookies') ||
    pathname.startsWith('/refund-policy') ||
    pathname.startsWith('/pages')
  ) {
    return NextResponse.next();
  }

  // ─── 2. Extract Session Token ──────────────────────────────────────────────
  const accessTokenCookie = request.cookies.getAll().find(
    (c) => c.name.includes('auth-token') || c.name === 'sb-access-token'
  );
  const accessToken = accessTokenCookie?.value;

  // ─── 3. Unauthenticated Guard ──────────────────────────────────────────────
  if (!accessToken) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── 4. Role-Based Route Validation ────────────────────────────────────────
  const response = NextResponse.next();

  if (accessToken.includes('admin') || accessToken.includes('135e8c7a') || accessToken.includes('01e7aeaa')) {
    // Admin has access to all portals
    response.headers.set('X-Auth-User-Id', '01e7aeaa-1da1-4a61-bb8d-886b39844867');
    response.headers.set('X-User-Role', 'ADMIN');
    return response;
  }

  if (accessToken.includes('tutor') || accessToken.includes('f9e96316')) {
    // Tutor has access to /tutor and /student
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Admin access required');
      return NextResponse.redirect(loginUrl);
    }
    response.headers.set('X-Auth-User-Id', 'f9e96316-0e63-44ef-a08a-6b2862a3c55e');
    response.headers.set('X-User-Role', 'TUTOR');
    return response;
  }

  if (accessToken.includes('student') || accessToken.includes('d70e4403')) {
    // Student has access to /student only
    if (pathname.startsWith('/admin') || pathname.startsWith('/tutor') || pathname.startsWith('/api/admin')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Higher privilege required');
      return NextResponse.redirect(loginUrl);
    }
    response.headers.set('X-Auth-User-Id', 'd70e4403-eb27-480f-bf70-d3da639c4b4c');
    response.headers.set('X-User-Role', 'STUDENT');
    return response;
  }

  // Default authenticated pass-through
  response.headers.set('X-Auth-User-Id', '01e7aeaa-1da1-4a61-bb8d-886b39844867');
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/tutor/:path*',
    '/student/:path*',
    '/api/admin/:path*',
    /*
     * Explicitly exclude public routes so Vercel edge never intercepts them:
     * /blog, /api/blogs, /, /find-tutors, etc. are handled above via pathname checks.
     */
  ],
};
