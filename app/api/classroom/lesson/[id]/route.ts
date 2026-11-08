/**
 * API Route: GET & PATCH /api/classroom/lesson/[id]
 * -----------------------------------------------------------------------
 * Universal classroom lesson loader & real-time state persistence endpoint
 * for both students and tutors.
 *
 * GET:
 *  - Default: Returns Lesson360Aggregate, currentUserRole, whiteboardState, chatMessages
 *  - ?syncOnly=1: Returns lightweight { lessonNotes, whiteboardState, chatMessages, materials, updatedAt }
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

async function resolveCallerRoleForLesson(
  lessonId: string,
  caller: { userId: string; isAdmin: boolean }
): Promise<{
  allowed: boolean;
  role: 'TUTOR' | 'STUDENT';
  row: any | null;
}> {
  const { data: row } = await adminSupabase
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
      tutor:tutor_profiles!lessons_tutor_id_fkey(id, user_id)
    `
    )
    .eq('id', lessonId)
    .maybeSingle();

  if (!row) {
    return { allowed: false, role: 'STUDENT', row: null };
  }

  const tutorUserId = (row.tutor as any)?.user_id;
  if (tutorUserId && tutorUserId === caller.userId) {
    return { allowed: true, role: 'TUTOR', row };
  }
  if (row.student_id === caller.userId) {
    return { allowed: true, role: 'STUDENT', row };
  }
  if (caller.isAdmin) {
    return { allowed: true, role: 'TUTOR', row };
  }

  return { allowed: false, role: 'STUDENT', row };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caller = await getAuthenticatedCaller(req);
    const { searchParams } = new URL(req.url);
    const syncOnly = searchParams.get('syncOnly') === '1';

    const { allowed, role, row } = await resolveCallerRoleForLesson(id, caller);
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

    const lesson = await lessonRepository.getLessonById(id);
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({
      lesson: {
        ...lesson,
        lessonNotes: row.lesson_notes ?? lesson.lessonNotes ?? '',
      },
      currentUserRole: role,
      whiteboardState: row.whiteboard_state || {},
      chatMessages: Array.isArray(row.chat_messages) ? row.chat_messages : [],
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
    const { id } = await params;
    const caller = await getAuthenticatedCaller(req);
    const { allowed, role, row } = await resolveCallerRoleForLesson(id, caller);

    if (!row) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
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
      const { data: mat, error: matErr } = await adminSupabase
        .from('lesson_materials')
        .insert({
          lesson_id: id,
          name: String(body.material.name).trim(),
          url: String(body.material.url).trim(),
          size_bytes: Number(body.material.sizeBytes || 0),
          file_type: body.material.fileType || 'document',
          uploaded_by_user_id: caller.userId,
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
