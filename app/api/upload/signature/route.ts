/**
 * API Route: POST /api/upload/signature
 * -----------------------------------------------------------------------
 * Returns signed parameters for direct browser upload to Cloudinary.
 * Protected by authentication.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateUploadSignature } from '@/src/shared/cloudinary/uploadSignature';
import { getAdminContext } from '@/src/shared/auth/authService';

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminContext(req);
    const body = await req.json().catch(() => ({}));
    const folder = body.folder || `sabina/tutor-docs/${user.id}`;

    const signatureData = generateUploadSignature(folder);
    return NextResponse.json(signatureData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
