import { NextRequest } from 'next/server';

/**
 * Resolves the true public origin (protocol + host) of the application
 * dynamically from incoming request headers (x-forwarded-host, host)
 * with robust fallbacks to Vercel production or NEXT_PUBLIC_APP_URL.
 */
export function getAppOrigin(request?: NextRequest): string {
  if (request) {
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const forwardedHost = request.headers.get('x-forwarded-host');
    if (forwardedHost) {
      return `${proto}://${forwardedHost.split(',')[0].trim()}`;
    }

    const host = request.headers.get('host');
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      return `https://${host}`;
    }

    if (request.nextUrl?.origin && !request.nextUrl.origin.includes('localhost')) {
      return request.nextUrl.origin;
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  // Fallback to active Vercel deployment URL
  return 'https://sabina-lms.vercel.app';
}
