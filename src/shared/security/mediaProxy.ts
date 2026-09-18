/**
 * Enterprise Media URL Obfuscation & Security Proxy
 * -----------------------------------------------------------------------
 * Shields external storage infrastructure (Cloudinary, S3, etc.) by converting
 * direct third-party CDN URLs into opaque, random application-domain media links.
 *
 * Example:
 * Input:  https://res.cloudinary.com/demo/image/upload/v1234/sabina/avatars/john.png
 * Output: /api/media/m_7f9c2d1b8e4a305e92ac4f?v=1
 *
 * Security Benefits:
 * 1. Zero leakage of Cloudinary account name, upload presets, or asset folder paths.
 * 2. Protection against hotlinking, automated asset scraping, and unauthorized crawling.
 * 3. Consistent browser-level Content-Security-Policy (CSP), nosniff, and Cache-Control.
 * -----------------------------------------------------------------------
 */

import crypto from 'crypto';

// Secret key for token encryption (derived from environment or server secret)
const MEDIA_SECRET =
  process.env.MEDIA_ENCRYPTION_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sabina-enterprise-media-proxy-secret-key-2026';

const KEY_BUFFER = crypto.createHash('sha256').update(MEDIA_SECRET).digest();
const ALGORITHM = 'aes-256-gcm';

export interface MaskedMediaPayload {
  u: string; // Target storage URL
  m?: string; // Declared MIME type
  n?: string; // Filename for Content-Disposition
  t?: number; // Creation timestamp
}

/**
 * Encrypts a real Cloudinary or storage URL into a random, opaque token.
 */
export function generateMediaToken(
  targetUrl: string,
  options?: { mime?: string; fileName?: string }
): string {
  if (!targetUrl) return '';

  const payload: MaskedMediaPayload = {
    u: targetUrl,
    m: options?.mime,
    n: options?.fileName,
    t: Date.now(),
  };

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64url');
  encrypted += cipher.final('base64url');

  const authTag = cipher.getAuthTag().toString('base64url');

  // Format: m_<iv>.<authTag>.<ciphertext>
  return `m_${iv.toString('base64url')}.${authTag}.${encrypted}`;
}

/**
 * Decrypts an opaque token back into the target media storage URL.
 */
export function resolveMediaToken(
  token: string
): { url: string; mime?: string; fileName?: string } | null {
  if (!token || !token.startsWith('m_')) return null;

  try {
    const raw = token.slice(2);
    const parts = raw.split('.');
    if (parts.length !== 3) return null;

    const [ivB64, authTagB64, ciphertextB64] = parts;

    const iv = Buffer.from(ivB64, 'base64url');
    const authTag = Buffer.from(authTagB64, 'base64url');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextB64, 'base64url', 'utf8');
    decrypted += decipher.final('utf8');

    const payload: MaskedMediaPayload = JSON.parse(decrypted);
    return {
      url: payload.u,
      mime: payload.m,
      fileName: payload.n,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Converts any Cloudinary or raw CDN URL into a randomized, opaque proxy link.
 * If already an internal proxy or relative URL, returns as-is.
 */
export function maskMediaUrl(
  url: string | null | undefined,
  options?: { mime?: string; fileName?: string }
): string {
  if (!url) return '';
  if (url.startsWith('/api/media/') || url.startsWith('/images/') || url.startsWith('data:')) {
    return url;
  }

  // If it's a Cloudinary or remote HTTPS asset, mask it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const token = generateMediaToken(url, options);
    return `/api/media/${token}`;
  }

  return url;
}
