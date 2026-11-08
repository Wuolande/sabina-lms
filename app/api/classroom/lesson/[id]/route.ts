/**
 * API Route: GET & PATCH /api/classroom/lesson/[id]
 * -----------------------------------------------------------------------
 * Universal classroom lesson loader & real-time state persistence endpoint
 * for both students and tutors, plus instant Sandbox Test Classroom support.
 *
 * GET:
 *  - Default: Returns Lesson360Aggregate, currentUserRole, whiteboardState, chatMessages
 *  - ?syncOnly=1: Returns lightweight { lessonNotes, whiteboardState, chatMessages, materials, updatedAt }
 *  - ?testRole=TUTOR|STUDENT: Instant testing mode bypass without requiring booking/login flow
 *
 * PATCH:
 *  - Persists shared live notes (lessonNotes), whiteboardState, chatMessages,
 *    or newly shared classroom materials for either TUTOR or STUDENT.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCaller } from '@/src/shared/auth/authService';
import { lessonRepository } from '@/src/modules/lessons/repositories/lessonRepository';
import { adminSupabase } from '@/src/shared/database/supabase';

export const SANDBOX_LESSON_ID = '00000000-0000-4000-8000-000000007e57';
export const SANDBOX_ROOM_ID = 'room-sabina-test-sandbox';

function normalizeLessonId(rawId: string): string {
  if (rawId === 'test-classroom' || rawId === 'sandbox' || rawId === SANDBOX_LESSON_ID) {
    return SANDBOX_LESSON_ID;
  }
  return rawId;
}

/**
 * Ensures a real row exists in `public.lessons` for SANDBOX_LESSON_ID so that
 * whiteboard_state, lesson_notes, chat_messages, and lesson_materials persist
 * identically to a production lesson during testing.
 */
async function ensureSandboxLessonRow(): Promise<any> {
  const { data: existing } = await adminSupabase
    .from('lessons')
    .select(
      `
      id,
      student_id,
      tutor_id,
      lesson_notes,
      whiteboard_state,
      chat_messages,
      updated_at,
      scheduled_start,
      scheduled_end,
      video_room_id,
      tutor:tutor_profiles!lessons_tutor_id_fkey(id, user_id)
    `
    )
    .eq('id', SANDBOX_LESSON_ID)
    .maybeSingle();

  if (existing) {
    // Keep scheduled_end in the future so the test timer is always active
    const endMs = existing.scheduled_end ? new Date(existing.scheduled_end).getTime() : 0;
    if (endMs < Date.now() + 5 * 60 * 1000) {
      const now = new Date();
      const newEnd = new Date(now.getTime() + 50 * 60 * 1000);
      await adminSupabase
        .from('lessons')
        .update({
          scheduled_start: now.toISOString(),
          scheduled_end: newEnd.toISOString(),
          status: 'IN_PROGRESS',
          video_room_id: SANDBOX_ROOM_ID,
        })
        .eq('id', SANDBOX_LESSON_ID);
      existing.scheduled_start = now.toISOString();
      existing.scheduled_end = newEnd.toISOString();
    }
    return existing;
  }

  // Pick any existing tutor profile and student user to satisfy foreign keys
  const [{ data: tutorProfile }, { data: anyUser }] = await Promise.all([
    adminSupabase.from('tutor_profiles').select('id, user_id').limit(1).maybeSingle(),
    adminSupabase.from('users').select('id').limit(1).maybeSingle(),
  ]);

  if (!tutorProfile || !anyUser) {
    return null;
  }

  const now = new Date();
  const scheduledEnd = new Date(now.getTime() + 50 * 60 * 1000);

  const { data: created, error } = await adminSupabase
    .from('lessons')
    .upsert(
      {
        id: SANDBOX_LESSON_ID,
        student_id: anyUser.id,
        tutor_id: tutorProfile.id,
        scheduled_start: now.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        status: 'IN_PROGRESS',
        video_room_id: SANDBOX_ROOM_ID,
        lesson_notes:
          'Welcome to the Sabina Live Classroom Sandbox!\n- Draw on the whiteboard to test real-time stroke & page sync.\n- Edit these Live Notes from either Tutor or Student view.\n- Share files or links in the Files tab.',
        whiteboard_state: {
          strokes: [],
          currentPage: 1,
          totalPages: 1,
          backgroundType: 'math_grid',
          isStudentAuthorized: true,
          updatedAt: Date.now(),
        },
        chat_messages: [],
      },
      { onConflict: 'id' }
    )
    .select(
      `
      id,
      student_id,
      tutor_id,
      lesson_notes,
      whiteboard_state,
      chat_messages,
      updated_at,
      scheduled_start,
      scheduled_end,
      video_room_id,
      tutor:tutor_profiles!lessons_tutor_id_fkey(id, user_id)
    `
    )
    .maybeSingle();

  if (error) {
    console.warn('[Sandbox Lesson Auto-Create Warning]', error.message);
  }
  return created;
}

async function resolveCallerRoleForLesson(
  lessonId: string,
  caller: { userId: string; isAdmin: boolean } | null,
  testRoleParam?: string | null
): Promise<{
  allowed: boolean;
  role: 'TUTOR' | 'STUDENT';
  row: any | null;
  isSandbox: boolean;
}> {
  const normalizedId = normalizeLessonId(lessonId);
  const isSandbox = normalizedId === SANDBOX_LESSON_ID || Boolean(testRoleParam);

  let row: any = null;
  if (normalizedId === SANDBOX_LESSON_ID) {
    row = await ensureSandboxLessonRow();
  } else {
    const { data } = await adminSupabase
      .from('lessons')
      .select(
        `
        id,
        student_id,
        tutor_id,
        lesson_notes,
        whiteboard_state,
        chat_messages,
        updated_at,
        scheduled_start,
        scheduled_end,
        video_room_id,
        tutor:tutor_profiles!lessons_tutor_id_fkey(id, user_id)
      `
      )
      .eq('id', normalizedId)
      .maybeSingle();
    row = data;
  }

  const forcedRole: 'TUTOR' | 'STUDENT' | null =
    testRoleParam?.toUpperCase() === 'TUTOR'
      ? 'TUTOR'
      : testRoleParam?.toUpperCase() === 'STUDENT'
      ? 'STUDENT'
      : null;

  if (isSandbox) {
    return {
      allowed: true,
      role: forcedRole || 'TUTOR',
      row:
        row || {
          id: normalizedId,
          lesson_notes: '',
          whiteboard_state: { isStudentAuthorized: true },
          chat_messages: [],
          updated_at: new Date().toISOString(),
        },
      isSandbox: true,
    };
  }

  if (!row || !caller?.userId) {
    return { allowed: false, role: 'STUDENT', row: null, isSandbox: false };
  }

  const tutorUserId = (row.tutor as any)?.user_id;
  if (tutorUserId && tutorUserId === caller.userId) {
    return { allowed: true, role: 'TUTOR', row, isSandbox: false };
  }
  if (row.student_id === caller.userId) {
    return { allowed: true, role: 'STUDENT', row, isSandbox: false };
  }
  if (caller.isAdmin) {
    return { allowed: true, role: 'TUTOR', row, isSandbox: false };
  }

  return { allowed: false, role: 'STUDENT', row, isSandbox: false };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = normalizeLessonId(rawId);
    const { searchParams } = new URL(req.url);
    const syncOnly = searchParams.get('syncOnly') === '1';
    const testRoleParam = searchParams.get('testRole');

    let caller: { userId: string; isAdmin: boolean } | null = null;
    try {
      caller = await getAuthenticatedCaller(req);
    } catch {
      caller = null;
    }

    const { allowed, role, row, isSandbox } = await resolveCallerRoleForLesson(
      id,
      caller,
      testRoleParam
    );

    if (!row) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (syncOnly) {
      const { data: materials } = await adminSupabase
        .from('lesson_materials')
        .select('id, name, url, size_bytes, file_type, uploaded_by_role, created_at')
        .eq('lesson_id', id)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        lessonNotes: row.lesson_notes || '',
        whiteboardState: row.whiteboard_state || {},
        chatMessages: Array.isArray(row.chat_messages) ? row.chat_messages : [],
        materials: (materials || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          url: m.url,
          sizeBytes: m.size_bytes,
          fileType: m.file_type,
          uploadedByRole: m.uploaded_by_role,
          createdAt: m.created_at,
        })),
        updatedAt: row.updated_at,
      });
    }

    let lesson = await lessonRepository.getLessonById(id);

    if (!lesson && isSandbox) {
      const now = new Date();
      const end = new Date(now.getTime() + 50 * 60 * 1000);
      lesson = {
        id: SANDBOX_LESSON_ID,
        bookingId: SANDBOX_LESSON_ID,
        bookingRef: 'BK-SANDBOX',
        scheduledStart: row.scheduled_start || now.toISOString(),
        scheduledEnd: row.scheduled_end || end.toISOString(),
        status: 'IN_PROGRESS' as any,
        videoRoomId: SANDBOX_ROOM_ID,
        lessonNotes: row.lesson_notes || '',
        hasStudentReviewed: false,
        createdAt: now.toISOString(),
        student: {
          id: row.student_id || 'sandbox-student',
          displayName: 'Anne Ouma (Student)',
          avatarUrl: '',
        },
        tutor: {
          id: row.tutor_id || 'sandbox-tutor',
          displayName: 'Alex Rivera (Tutor)',
          avatarUrl: '',
          hourlyRate: 25,
          currency: 'USD',
        },
        subject: {
          name: 'Interactive Classroom Sandbox',
        },
        materials: [],
      };
    }

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Override sandbox display names and room so testing is crystal clear
    if (id === SANDBOX_LESSON_ID) {
      lesson = {
        ...lesson,
        videoRoomId: SANDBOX_ROOM_ID,
        subject: { name: 'Live Classroom Test Session' },
        tutor: {
          ...lesson.tutor,
          displayName: lesson.tutor?.displayName || 'Alex Rivera',
        },
        student: {
          ...lesson.student,
          displayName: lesson.student?.displayName || 'Anne Ouma',
        },
      };
    }

    return NextResponse.json({
      lesson: {
        ...lesson,
        lessonNotes: row.lesson_notes ?? lesson.lessonNotes ?? '',
      },
      currentUserRole: role,
      whiteboardState: row.whiteboard_state || {},
      chatMessages: Array.isArray(row.chat_messages) ? row.chat_messages : [],
      isSandbox,
    });
  } catch (error: any) {
    console.error('[GET /api/classroom/lesson/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = normalizeLessonId(rawId);
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const testRoleParam = searchParams.get('testRole') || body.testRole;

    let caller: { userId: string; isAdmin: boolean } | null = null;
    try {
      caller = await getAuthenticatedCaller(req);
    } catch {
      caller = null;
    }

    const { allowed, role, row } = await resolveCallerRoleForLesson(id, caller, testRoleParam);

    if (!row) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Support resetting sandbox classroom state
    if (body.resetSandbox && id === SANDBOX_LESSON_ID) {
      const now = new Date();
      const scheduledEnd = new Date(now.getTime() + 50 * 60 * 1000);
      await adminSupabase.from('lesson_materials').delete().eq('lesson_id', SANDBOX_LESSON_ID);
      await adminSupabase
        .from('lessons')
        .update({
          scheduled_start: now.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          lesson_notes: '',
          whiteboard_state: {
            strokes: [],
            currentPage: 1,
            totalPages: 1,
            backgroundType: 'math_grid',
            isStudentAuthorized: true,
            updatedAt: Date.now(),
          },
          chat_messages: [],
          updated_at: now.toISOString(),
        })
        .eq('id', SANDBOX_LESSON_ID);

      return NextResponse.json({ success: true, reset: true });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.lessonNotes === 'string') {
      updates.lesson_notes = body.lessonNotes;
    }

    if (body.whiteboardState && typeof body.whiteboardState === 'object') {
      const existingWb =
        row.whiteboard_state && typeof row.whiteboard_state === 'object'
          ? row.whiteboard_state
          : {};
      updates.whiteboard_state = {
        ...existingWb,
        ...body.whiteboardState,
        updatedAt: Date.now(),
      };
    }

    if (body.chatMessage && typeof body.chatMessage === 'object') {
      const existingChat = Array.isArray(row.chat_messages) ? row.chat_messages : [];
      const alreadyExists = existingChat.some((m: any) => m.id === body.chatMessage.id);
      if (!alreadyExists) {
        updates.chat_messages = [...existingChat.slice(-199), body.chatMessage];
      }
    }

    let createdMaterial: any = null;
    if (body.material && body.material.name && body.material.url) {
      const uploaderId = caller?.userId || row.student_id;
      const { data: mat, error: matErr } = await adminSupabase
        .from('lesson_materials')
        .insert({
          lesson_id: id,
          name: String(body.material.name).trim(),
          url: String(body.material.url).trim(),
          size_bytes: Number(body.material.sizeBytes || 0),
          file_type: body.material.fileType || 'document',
          uploaded_by_user_id: uploaderId,
          uploaded_by_role: role,
        })
        .select('id, name, url, size_bytes, file_type, uploaded_by_role, created_at')
        .single();

      if (!matErr && mat) {
        createdMaterial = {
          id: mat.id,
          name: mat.name,
          url: mat.url,
          sizeBytes: mat.size_bytes,
          fileType: mat.file_type,
          uploadedByRole: mat.uploaded_by_role,
          createdAt: mat.created_at,
        };
      }
    }

    if (Object.keys(updates).length > 1) {
      await adminSupabase.from('lessons').update(updates).eq('id', id);
    }

    return NextResponse.json({
      success: true,
      material: createdMaterial,
      updatedAt: updates.updated_at,
    });
  } catch (error: any) {
    console.error('[PATCH /api/classroom/lesson/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
