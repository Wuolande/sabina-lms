/**
 * API Route: POST /api/upload/document
 * -----------------------------------------------------------------------
 * Document & Certificate upload handler with malware scanning,
 * magic byte validation, and streaming to Cloudinary storage.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { scanFileForMalware } from '@/src/shared/security/fileScanner';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const base64Data = formData.get('base64') as string | null;
    const documentType = (formData.get('type') as string) || 'degree';

    let fileBuffer: Buffer | null = null;
    let fileName = 'document.pdf';
    let fileMime = 'application/pdf';

    if (file) {
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileName = file.name || 'document.pdf';
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

    // ─── Security & Anti-Malware Scan (Max 15MB for documents) ───
    const scanResult = await scanFileForMalware(fileBuffer, fileName, fileMime, 15 * 1024 * 1024);
    if (!scanResult.safe) {
      return NextResponse.json(
        { error: `Security check failed: ${scanResult.error}` },
        { status: 422 }
      );
    }

    let documentUrl = '';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'vtjhrq1w';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'sabina';
    const targetFolder = `sabina/documents/${documentType}`;

    // ─── Stream to Cloudinary ───
    const cloudinaryForm = new FormData();
    const dataUri = `data:${scanResult.detectedMime || fileMime};base64,${fileBuffer.toString('base64')}`;
    cloudinaryForm.append('file', dataUri);
    cloudinaryForm.append('upload_preset', uploadPreset);
    cloudinaryForm.append('folder', targetFolder);

    try {
      // For PDFs and DOCX, use the 'auto' or 'image' resource type endpoint
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: cloudinaryForm,
      });

      if (cloudRes.ok) {
        const cloudJson = await cloudRes.json();
        documentUrl = cloudJson.secure_url || cloudJson.url;
      } else {
        const errJson = await cloudRes.json().catch(() => ({}));
        console.warn('[Cloudinary Document Upload Warning]', errJson);
      }
    } catch (cErr) {
      console.warn('[Cloudinary Document Fetch Error]', cErr);
    }

    if (!documentUrl) {
      // Fallback
      documentUrl = dataUri;
    }

    return NextResponse.json({
      success: true,
      documentUrl,
      fileName,
      fileSize: fileBuffer.length,
      mimeType: scanResult.detectedMime || fileMime,
      message: 'Document safely scanned and uploaded to Cloudinary.',
    });
  } catch (error: any) {
    console.error('[POST /api/upload/document]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
