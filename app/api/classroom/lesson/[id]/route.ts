/**
 * API Route: GET /api/classroom/lesson/[id]
 * -----------------------------------------------------------------------
 * Universal classroom lesson loader for both students and tutors.
 * Returns the Lesson360Aggregate and detects the caller's role (TUTOR / STUDENT),
 * avoiding 404 trial-and-error fetching in the client.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCaller } from '@/src/shared/auth/authService';
import { lessonRepository } from '@/src/modules/lessons/repositories/lessonRepository';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caller = await getAuthenticatedCaller(req);

    const lesson = await lessonRepository.getLessonById(id);
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Determine caller's role in this session
    let role: 'TUTOR' | 'STUDENT' = 'STUDENT';

    // Check if caller is the tutor (match via tutor_profiles user_id)
    const { data: tutorProfile } = await adminSupabase
      .from('tutor_profiles')
      .select('id, user_id')
      .eq('user_id', caller.userId)
      .maybeSingle();

    if (tutorProfile && tutorProfile.id === lesson.tutor.id) {
      role = 'TUTOR';
    } else if (lesson.student.id === caller.userId) {
      role = 'STUDENT';
    } else if (caller.isAdmin) {
      role = 'TUTOR'; // Admins preview as tutor
    }

    return NextResponse.json({
      lesson,
      currentUserRole: role,
    });
  } catch (error: any) {
    console.error('[GET /api/classroom/lesson/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
