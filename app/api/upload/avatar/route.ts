/**
 * API Route: POST /api/upload/avatar
 * -----------------------------------------------------------------------
 * Profile picture upload handler with:
 * - Strict Session Authentication & IDOR Protection
 * - Rate Limiting & Sliding Window Abuse Defense
 * - Anti-Malware Magic Bytes Inspection (Raster Images only, SVGs banned)
 * - Media URL Obfuscation: Hides Cloudinary domain from frontend & clients
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAuthenticatedCaller } from '@/src/shared/auth/authService';
import { scanFileForMalware, sanitizeUploadFilename } from '@/src/shared/security/fileScanner';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';
import { maskMediaUrl } from '@/src/shared/security/mediaProxy';

const ALLOWED_AVATAR_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate session
    let caller;
    try {
      caller = await getAuthenticatedCaller(req);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to upload an avatar.' },
        { status: 401 }
      );
    }

    // 2. Enforce Rate Limiting (max 10 avatar uploads per 5 minutes per user)
    const rateLimit = checkRateLimit(`avatar_up_${caller.userId}`, {
      maxAttempts: 10,
      windowMs: 5 * 60 * 1000,
      lockoutDurationMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many avatar uploads. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    // 3. Extract form data & parse payload
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const base64Data = formData.get('base64') as string | null;
    const targetUserId = (formData.get('userId') as string) || null;

    // IDOR Authorization check: Regular users cannot overwrite another user's avatar
    const effectiveUserId =
      targetUserId && caller.isAdmin ? targetUserId : caller.userId;

    if (targetUserId && targetUserId !== caller.userId && !caller.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot modify avatars of other users.' },
        { status: 403 }
      );
    }

    let fileBuffer: Buffer | null = null;
    let fileName = 'avatar.png';
    let fileMime = 'image/png';

    if (file) {
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileName = sanitizeUploadFilename(file.name || 'avatar.jpg');
      fileMime = file.type || 'image/jpeg';
    } else if (base64Data) {
      const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        fileMime = match[1];
        fileBuffer = Buffer.from(match[2], 'base64');
      } else {
        fileBuffer = Buffer.from(base64Data, 'base64');
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: 'No valid image file provided.' }, { status: 400 });
    }

    // 4. Security & Anti-Malware Scan (Max 5MB for profile photos)
    const scanResult = await scanFileForMalware(fileBuffer, fileName, fileMime, 5 * 1024 * 1024);
    if (!scanResult.safe) {
      return NextResponse.json(
        { error: `Security check failed: ${scanResult.error}` },
        { status: 422 }
      );
    }

    const detectedMime = scanResult.detectedMime || fileMime;
    if (!ALLOWED_AVATAR_MIMES.has(detectedMime)) {
      return NextResponse.json(
        { error: 'Invalid avatar format. Only standard JPG, PNG, and WebP images are allowed.' },
        { status: 422 }
      );
    }

    // 5. Stream to Cloudinary backend
    let rawStorageUrl = '';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'vtjhrq1w';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'sabina';

    const cloudinaryForm = new FormData();
    const dataUri = `data:${detectedMime};base64,${fileBuffer.toString('base64')}`;
    cloudinaryForm.append('file', dataUri);
    cloudinaryForm.append('upload_preset', uploadPreset);
    cloudinaryForm.append('folder', `sabina/avatars/${effectiveUserId}`);

    try {
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cloudinaryForm,
      });

      if (cloudRes.ok) {
        const cloudJson = await cloudRes.json();
        rawStorageUrl = cloudJson.secure_url || cloudJson.url;

        // Record asset in file_assets table for audit tracking
        await adminSupabase.from('file_assets').insert({
          owner_id: effectiveUserId,
          public_id: cloudJson.public_id || `avatar_${effectiveUserId}_${Date.now()}`,
          secure_url: rawStorageUrl,
          resource_type: 'image',
          format: cloudJson.format || 'png',
          mime_type: detectedMime,
          bytes: fileBuffer.length,
          folder: `sabina/avatars/${effectiveUserId}`,
          entity_type: 'USER_AVATAR',
          entity_id: effectiveUserId,
        }).catch((err) => console.warn('[file_assets tracking notice]', err?.message));
      } else {
        const errJson = await cloudRes.json().catch(() => ({}));
        console.warn('[Cloudinary Avatar Upload Warning]', errJson);
      }
    } catch (cErr) {
      console.warn('[Cloudinary Avatar Fetch Error]', cErr);
    }

    if (!rawStorageUrl) {
      return NextResponse.json(
        { error: 'Storage service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // 6. Obfuscate Cloudinary URL into randomized application media link
    const maskedAvatarUrl = maskMediaUrl(rawStorageUrl, {
      mime: detectedMime,
      fileName: `avatar_${effectiveUserId.slice(0, 8)}.webp`,
    });

    // 7. Update User Profile in Database with the masked URL
    const { error: dbError } = await adminSupabase
      .from('users')
      .update({ avatar_url: maskedAvatarUrl, updated_at: new Date().toISOString() })
      .eq('id', effectiveUserId);

    if (dbError) {
      console.error('[Avatar DB Update Error]', dbError);
    }

    return NextResponse.json({
      success: true,
      avatarUrl: maskedAvatarUrl,
      message: 'Avatar securely processed, scanned, and updated.',
    });
  } catch (error: any) {
    console.error('[POST /api/upload/avatar]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
