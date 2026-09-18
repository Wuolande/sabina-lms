/**
 * API Route: POST /api/upload/logo
 * -----------------------------------------------------------------------
 * Platform Logo upload handler with:
 * - Admin Authentication Guard (Privilege Enforcement)
 * - Anti-Malware Magic Bytes Scan (PNG, JPG, WebP only)
 * - Media URL Obfuscation: Shields Cloudinary infrastructure from public view
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/src/shared/auth/authService';
import { scanFileForMalware, sanitizeUploadFilename } from '@/src/shared/security/fileScanner';
import { maskMediaUrl } from '@/src/shared/security/mediaProxy';
import { adminSupabase } from '@/src/shared/database/supabase';

const ALLOWED_LOGO_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Admin Authorization
    let admin;
    try {
      admin = await getAdminContext(req);
    } catch {
      return NextResponse.json(
        { error: 'Forbidden: Only platform administrators can update brand logos.' },
        { status: 403 }
      );
    }

    // 2. Extract form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const base64Data = formData.get('base64') as string | null;

    let fileBuffer: Buffer | null = null;
    let fileName = 'platform-logo.png';
    let fileMime = 'image/png';

    if (file) {
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileName = sanitizeUploadFilename(file.name || 'logo.png');
      fileMime = file.type || 'image/png';
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

    // 3. Security & Anti-Malware Scan (Max 5MB)
    const scanResult = await scanFileForMalware(fileBuffer, fileName, fileMime, 5 * 1024 * 1024);
    if (!scanResult.safe) {
      return NextResponse.json(
        { error: `Security check failed: ${scanResult.error}` },
        { status: 422 }
      );
    }

    const detectedMime = scanResult.detectedMime || fileMime;
    if (!ALLOWED_LOGO_MIMES.has(detectedMime)) {
      return NextResponse.json(
        { error: 'Invalid logo format. Only PNG, JPG, and WebP raster images are permitted.' },
        { status: 422 }
      );
    }

    // 4. Stream to Cloudinary branding folder
    let rawStorageUrl = '';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'vtjhrq1w';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'sabina';

    const cloudinaryForm = new FormData();
    const dataUri = `data:${detectedMime};base64,${fileBuffer.toString('base64')}`;
    cloudinaryForm.append('file', dataUri);
    cloudinaryForm.append('upload_preset', uploadPreset);
    cloudinaryForm.append('folder', 'sabina/branding');

    try {
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cloudinaryForm,
      });

      if (cloudRes.ok) {
        const cloudJson = await cloudRes.json();
        rawStorageUrl = cloudJson.secure_url || cloudJson.url;

        // Record asset in file_assets table
        await adminSupabase.from('file_assets').insert({
          owner_id: admin.id,
          public_id: cloudJson.public_id || `logo_${Date.now()}`,
          secure_url: rawStorageUrl,
          resource_type: 'image',
          format: cloudJson.format || 'png',
          mime_type: detectedMime,
          bytes: fileBuffer.length,
          folder: 'sabina/branding',
          entity_type: 'PLATFORM_LOGO',
          entity_id: 'brand',
        }).catch((err) => console.warn('[file_assets tracking notice]', err?.message));
      } else {
        const errJson = await cloudRes.json().catch(() => ({}));
        console.warn('[Cloudinary Logo Upload Warning]', errJson);
      }
    } catch (cErr) {
      console.warn('[Cloudinary Logo Fetch Error]', cErr);
    }

    if (!rawStorageUrl) {
      return NextResponse.json(
        { error: 'Branding storage service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // 5. Obfuscate Cloudinary URL into randomized application media link
    const maskedLogoUrl = maskMediaUrl(rawStorageUrl, {
      mime: detectedMime,
      fileName: 'platform_logo.webp',
    });

    return NextResponse.json({
      success: true,
      url: maskedLogoUrl,
      logoUrl: maskedLogoUrl,
      fileName,
      fileSize: fileBuffer.length,
    });
  } catch (err: any) {
    console.error('[POST /api/upload/logo Error]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload logo asset.' },
      { status: 500 }
    );
  }
}
