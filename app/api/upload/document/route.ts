/**
 * API Route: POST /api/upload/document
 * -----------------------------------------------------------------------
 * Document & Certificate upload handler with:
 * - Session Authentication & Per-User Isolation
 * - Rate Limiting & Sliding Window Abuse Defense
 * - Deep Anti-Malware & Magic Byte Inspection (PDF, PNG, JPG only)
 * - Media URL Obfuscation: Hides Cloudinary domain from frontend & clients
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAuthenticatedCaller } from '@/src/shared/auth/authService';
import { scanFileForMalware, sanitizeUploadFilename } from '@/src/shared/security/fileScanner';
import { checkRateLimit } from '@/src/shared/security/rateLimiter';
import { maskMediaUrl } from '@/src/shared/security/mediaProxy';

const ALLOWED_DOC_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Authentication
    let caller;
    try {
      caller = await getAuthenticatedCaller(req);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to upload documents.' },
        { status: 401 }
      );
    }

    // 2. Enforce Rate Limiting
    const rateLimit = checkRateLimit(`doc_up_${caller.userId}`, {
      maxAttempts: 10,
      windowMs: 5 * 60 * 1000,
      lockoutDurationMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many document uploads. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    // 3. Extract form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const base64Data = formData.get('base64') as string | null;
    const rawDocType = (formData.get('type') as string) || 'document';
    const documentType = rawDocType.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);

    let fileBuffer: Buffer | null = null;
    let fileName = 'document.pdf';
    let fileMime = 'application/pdf';

    if (file) {
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileName = sanitizeUploadFilename(file.name || 'document.pdf');
      fileMime = file.type || 'application/pdf';
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
      return NextResponse.json({ error: 'No valid document file provided.' }, { status: 400 });
    }

    // 4. Security & Anti-Malware Scan (Max 15MB for documents)
    const scanResult = await scanFileForMalware(fileBuffer, fileName, fileMime, 15 * 1024 * 1024);
    if (!scanResult.safe) {
      return NextResponse.json(
        { error: `Security check failed: ${scanResult.error}` },
        { status: 422 }
      );
    }

    const detectedMime = scanResult.detectedMime || fileMime;
    if (!ALLOWED_DOC_MIMES.has(detectedMime)) {
      return NextResponse.json(
        { error: 'Disallowed document format. Only PDF, Word (.docx), and high-res images are accepted.' },
        { status: 422 }
      );
    }

    // 5. Stream to Cloudinary backend under isolated user folder
    let rawStorageUrl = '';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'vtjhrq1w';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'sabina';
    const targetFolder = `sabina/documents/${caller.userId}/${documentType}`;

    const cloudinaryForm = new FormData();
    const dataUri = `data:${detectedMime};base64,${fileBuffer.toString('base64')}`;
    cloudinaryForm.append('file', dataUri);
    cloudinaryForm.append('upload_preset', uploadPreset);
    cloudinaryForm.append('folder', targetFolder);

    try {
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: cloudinaryForm,
      });

      if (cloudRes.ok) {
        const cloudJson = await cloudRes.json();
        rawStorageUrl = cloudJson.secure_url || cloudJson.url;

        // Record asset in file_assets table
        await adminSupabase.from('file_assets').insert({
          owner_id: caller.userId,
          public_id: cloudJson.public_id || `doc_${caller.userId}_${Date.now()}`,
          secure_url: rawStorageUrl,
          resource_type: 'raw',
          format: cloudJson.format || 'pdf',
          mime_type: detectedMime,
          bytes: fileBuffer.length,
          folder: targetFolder,
          entity_type: 'USER_DOCUMENT',
          entity_id: caller.userId,
        }).catch((err) => console.warn('[file_assets tracking notice]', err?.message));
      } else {
        const errJson = await cloudRes.json().catch(() => ({}));
        console.warn('[Cloudinary Document Upload Warning]', errJson);
      }
    } catch (cErr) {
      console.warn('[Cloudinary Document Fetch Error]', cErr);
    }

    if (!rawStorageUrl) {
      return NextResponse.json(
        { error: 'Document storage service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    // 6. Obfuscate Cloudinary URL into randomized application media link
    const maskedDocUrl = maskMediaUrl(rawStorageUrl, {
      mime: detectedMime,
      fileName,
    });

    return NextResponse.json({
      success: true,
      documentUrl: maskedDocUrl,
      fileName,
      fileSize: fileBuffer.length,
      mimeType: detectedMime,
      message: 'Document safely scanned and verified.',
    });
  } catch (error: any) {
    console.error('[POST /api/upload/document]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
