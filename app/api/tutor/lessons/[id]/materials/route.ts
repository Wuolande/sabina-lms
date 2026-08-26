/**
 * API Route: POST /api/tutor/lessons/[id]/materials
 * -----------------------------------------------------------------------
 * Attaches a worksheet, homework, or lesson recording URL to a lesson.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainLessonService } from '@/src/modules/lessons/services/lessonService';
import { getTutorContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const MaterialSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  sizeBytes: z.number().optional(),
  fileType: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tutor = await getTutorContext(req);
    const body = await req.json();
    const parsed = MaterialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid file name and URL required.' }, { status: 400 });
    }

    const material = await domainLessonService.uploadMaterial(id, {
      name: parsed.data.name,
      url: parsed.data.url,
      sizeBytes: parsed.data.sizeBytes,
      fileType: parsed.data.fileType,
      uploadedByUserId: tutor.userId,
      uploadedByRole: 'TUTOR',
    });

    return NextResponse.json({ success: true, material }, { status: 201 });

  } catch (error: any) {
    console.error('[POST /api/tutor/lessons/[id]/materials]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
