/**
 * API Route: GET /api/student/goals
 *           POST /api/student/goals
 * -----------------------------------------------------------------------
 * GET  — List student learning goals.
 * POST — Create a new learning goal.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const CreateGoalSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  subjectId: z.string().optional(),
  subjectName: z.string().optional(),
  targetDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const student360 = await domainStudentService.getStudent360(student.userId);
    return NextResponse.json(student360.goals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const body = await req.json();
    const parsed = CreateGoalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid goal data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const goal = await domainStudentService.addGoal(student.userId, parsed.data);
    return NextResponse.json(goal, { status: 201 });

  } catch (error: any) {
    console.error('[POST /api/student/goals]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
