/**
 * API Route: PUT /api/tutor/students/[id]/notes
 * -----------------------------------------------------------------------
 * Updates tutor's private notes, curriculum roadmap, and enrollment status.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getTutorContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const UpdateNotesSchema = z.object({
  privateTutorNotes: z.string().optional(),
  tutorRoadmap: z.string().optional(),
  targetLevel: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tutor = await getTutorContext(req);
    const body = await req.json();
    const parsed = UpdateNotesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.format() }, { status: 400 });
    }

    const updated = await domainStudentService.updateStudentEnrollmentFull(
      tutor.tutorProfileId,
      id,
      parsed.data
    );

    return NextResponse.json({ success: true, enrollment: updated });

  } catch (error: any) {
    console.error('[PUT /api/tutor/students/[id]/notes]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
