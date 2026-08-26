/**
 * API Route: PATCH /api/student/goals/[id]
 *           DELETE /api/student/goals/[id]
 * -----------------------------------------------------------------------
 * PATCH  — Update progress percentage on a learning goal.
 * DELETE — Delete a learning goal.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const UpdateProgressSchema = z.object({
  progressPercent: z.number().min(0).max(100),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await getStudentContext(req);
    const body = await req.json();
    const parsed = UpdateProgressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid progress value (0-100)' }, { status: 400 });
    }

    await domainStudentService.updateGoalProgress(id, parsed.data.progressPercent, student.userId);
    return NextResponse.json({ success: true, progressPercent: parsed.data.progressPercent });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await getStudentContext(req);

    await domainStudentService.deleteGoal(id, student.userId);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
