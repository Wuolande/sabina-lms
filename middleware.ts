import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-browser cookies, so just do it here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1. Public Routes bypass check completely
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
    return supabaseResponse;
  }

  // 2. Unauthenticated Guard
  if (!user) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user?.user_metadata?.role || 'STUDENT';

  // 3. Role-Based Route Validation
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    // Admin has access to all portals
    supabaseResponse.headers.set('X-Auth-User-Id', user.id);
    supabaseResponse.headers.set('X-User-Role', role);
    return supabaseResponse;
  }

  if (role === 'TUTOR') {
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Admin access required');
      return NextResponse.redirect(loginUrl);
    }
    supabaseResponse.headers.set('X-Auth-User-Id', user.id);
    supabaseResponse.headers.set('X-User-Role', 'TUTOR');
    return supabaseResponse;
  }

  if (role === 'STUDENT') {
    if (pathname.startsWith('/admin') || pathname.startsWith('/tutor') || pathname.startsWith('/api/admin')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Higher privilege required');
      return NextResponse.redirect(loginUrl);
    }
    supabaseResponse.headers.set('X-Auth-User-Id', user.id);
    supabaseResponse.headers.set('X-User-Role', 'STUDENT');
    return supabaseResponse;
  }

  // Fallback
  supabaseResponse.headers.set('X-Auth-User-Id', user.id);
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/tutor/:path*',
    '/student/:path*',
    '/api/admin/:path*',
  ],
};
