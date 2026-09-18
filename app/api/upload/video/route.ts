/**
 * API Route: POST /api/upload/video
 * -----------------------------------------------------------------------
 * Video upload handler (MP4, WebM, QuickTime) with:
 * - Tutor / Admin Session Authentication
 * - Rate Limiting & Sliding Window Abuse Defense
 * - Magic Byte Verification & Anti-Malware Inspection
 * - Media URL Obfuscation: Completely hides Cloudinary storage domain
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAuthenticatedCaller } from '@/src/shared/auth/authService';
import { scanFileForMalware, sanitizeUploadFilename } from '@/src/shared/security/fileScanner';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';
import { maskMediaUrl } from '@/src/shared/security/mediaProxy';

const ALLOWED_VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Authentication
    let caller;
    try {
      caller = await getAuthenticatedCaller(req);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to upload video assets.' },
        { status: 401 }
      );
    }

    // Role check: Only tutors and admins can upload videos
    const isTutorOrAdmin =
      caller.isAdmin || caller.roles.includes('TUTOR') || caller.roles.includes('INSTRUCTOR');
    if (!isTutorOrAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only verified tutors and administrators can upload intro videos.' },
        { status: 403 }
      );
    }

    // 2. Enforce Rate Limiting (max 5 video uploads per 15 minutes)
    const rateLimit = checkRateLimit(`vid_up_${caller.userId}`, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      lockoutDurationMs: 30 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Video upload rate limit reached. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    // 3. Extract form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const base64Data = formData.get('base64') as string | null;

    let fileBuffer: Buffer | null = null;
    let fileName = 'intro-video.mp4';
    let fileMime = 'video/mp4';

    if (file) {
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileName = sanitizeUploadFilename(file.name || 'intro-video.mp4');
      fileMime = file.type || 'video/mp4';
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
      return NextResponse.json({ error: 'No video file provided.' }, { status: 400 });
    }

    // 4. Security & Anti-Malware Scan (Max 50MB for videos)
    const scanResult = await scanFileForMalware(fileBuffer, fileName, fileMime, 50 * 1024 * 1024);
    if (!scanResult.safe) {
      return NextResponse.json(
        { error: `Security check failed: ${scanResult.error}` },
        { status: 422 }
      );
    }

    const detectedMime = scanResult.detectedMime || fileMime;
    if (!ALLOWED_VIDEO_MIMES.has(detectedMime)) {
      return NextResponse.json(
        { error: 'Invalid video format. Only MP4, WebM, and QuickTime videos are accepted.' },
        { status: 422 }
      );
    }

    // 5. Stream to Cloudinary video storage
    let rawStorageUrl = '';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'vtjhrq1w';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'sabina';
    const targetFolder = `sabina/videos/${caller.userId}`;

    const cloudinaryForm = new FormData();
    const dataUri = `data:${detectedMime};base64,${fileBuffer.toString('base64')}`;
    cloudinaryForm.append('file', dataUri);
    cloudinaryForm.append('upload_preset', uploadPreset);
    cloudinaryForm.append('folder', targetFolder);

    try {
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
        method: 'POST',
        body: cloudinaryForm,
      });

      if (cloudRes.ok) {
        const cloudJson = await cloudRes.json();
        rawStorageUrl = cloudJson.secure_url || cloudJson.url;

        // Record in file_assets table
        await adminSupabase.from('file_assets').insert({
          owner_id: caller.userId,
          public_id: cloudJson.public_id || `video_${caller.userId}_${Date.now()}`,
          secure_url: rawStorageUrl,
          resource_type: 'video',
          format: cloudJson.format || 'mp4',
          mime_type: detectedMime,
          bytes: fileBuffer.length,
          folder: targetFolder,
          entity_type: 'TUTOR_INTRO_VIDEO',
          entity_id: caller.userId,
        }).catch((err) => console.warn('[file_assets tracking notice]', err?.message));
      } else {
        const errJson = await cloudRes.json().catch(() => ({}));
        console.warn('[Cloudinary Video Upload Warning]', errJson);
      }
    } catch (cErr) {
      console.warn('[Cloudinary Video Fetch Error]', cErr);
    }

    if (!rawStorageUrl) {
      return NextResponse.json(
        { error: 'Video storage service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // 6. Obfuscate Cloudinary URL into randomized application media link
    const maskedVideoUrl = maskMediaUrl(rawStorageUrl, {
      mime: detectedMime,
      fileName,
    });

    return NextResponse.json({
      success: true,
      videoUrl: maskedVideoUrl,
      fileName,
      fileSize: fileBuffer.length,
      message: 'Video safely scanned and uploaded.',
    });
  } catch (error: any) {
    console.error('[POST /api/upload/video]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
