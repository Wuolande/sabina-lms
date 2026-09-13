/**
 * API Route: POST /api/upload/logo
 * -----------------------------------------------------------------------
 * Platform Logo upload handler with server-side malware scanning
 * and streaming to Cloudinary branding storage.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { scanFileForMalware } from '@/src/shared/security/fileScanner';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const base64Data = formData.get('base64') as string | null;

    let fileBuffer: Buffer | null = null;
    let fileName = 'platform-logo.png';
    let fileMime = 'image/png';

    if (file) {
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileName = file.name || 'logo.png';
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

    // ─── Security & Anti-Malware Scan (Max 5MB) ───
    const scanResult = await scanFileForMalware(fileBuffer, fileName, fileMime, 5 * 1024 * 1024);
    if (!scanResult.safe) {
      return NextResponse.json(
        { error: `Security check failed: ${scanResult.error}` },
        { status: 422 }
      );
    }

    let logoUrl = '';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'vtjhrq1w';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'sabina';

    // ─── Stream to Cloudinary ───
    const cloudinaryForm = new FormData();
    const dataUri = `data:${scanResult.detectedMime || fileMime};base64,${fileBuffer.toString('base64')}`;
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
        logoUrl = cloudJson.secure_url || cloudJson.url;
      } else {
        const errJson = await cloudRes.json().catch(() => ({}));
        console.warn('[Cloudinary Logo Upload Warning]', errJson);
      }
    } catch (cErr) {
      console.warn('[Cloudinary Logo Fetch Error]', cErr);
    }

    if (!logoUrl) {
      // Fallback: Use base64 Data URI if Cloudinary upload was unavailable
      logoUrl = dataUri;
    }

    return NextResponse.json({
      success: true,
      url: logoUrl,
      logoUrl,
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
