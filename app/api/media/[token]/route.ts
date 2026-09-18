/**
 * API Route: GET /api/media/[token]
 * -----------------------------------------------------------------------
 * High-performance streaming proxy for obfuscated media assets.
 * Fetches assets from Cloudinary or storage backend server-side,
 * strips upstream CDN headers, enforces nosniff, and caches aggressively.
 *
 * Browsers and users never see the underlying Cloudinary domain or account name.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveMediaToken } from '@/src/shared/security/mediaProxy';
import { adminSupabase } from '@/src/shared/database/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return new NextResponse('Media token required', { status: 400 });
    }

    // 1. Attempt token decryption
    let resolved = resolveMediaToken(token);

    // 2. Fallback: Check if token is a file_assets UUID
    if (!resolved) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
      if (isUuid) {
        const { data: asset } = await adminSupabase
          .from('file_assets')
          .select('secure_url, mime_type')
          .eq('id', token)
          .single();

        if (asset?.secure_url) {
          resolved = {
            url: asset.secure_url,
            mime: asset.mime_type || undefined,
          };
        }
      }
    }

    if (!resolved || !resolved.url) {
      return new NextResponse('Media asset not found or token expired', { status: 404 });
    }

    // 3. Server-side fetch from upstream storage
    const upstreamRes = await fetch(resolved.url, {
      headers: {
        'User-Agent': 'Sabina-Media-Proxy/1.0',
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      return new NextResponse('Failed to retrieve upstream asset', {
        status: upstreamRes.status === 404 ? 404 : 502,
      });
    }

    // 4. Construct sanitized response headers
    const contentType =
      resolved.mime ||
      upstreamRes.headers.get('content-type') ||
      'application/octet-stream';

    const contentLength = upstreamRes.headers.get('content-length');
    const safeFilename = resolved.fileName || 'download';

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    responseHeaders.set(
      'Content-Disposition',
      `inline; filename="${safeFilename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`
    );

    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    // Stream the body directly to client
    return new NextResponse(upstreamRes.body as any, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('[Media Proxy Error]', err);
    return new NextResponse('Internal Media Proxy Error', { status: 500 });
  }
}
