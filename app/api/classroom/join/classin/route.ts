/**
 * API Route: GET /api/classroom/join/classin
 * -----------------------------------------------------------------------
 * Generates a ClassIn classroom join URL for a given lesson.
 *
 * Flow:
 *   1. Use ClassIn Partner API (api.classin.com) to create or look up
 *      a classroom for this lesson's room ID
 *   2. Return a signed join URL for the student/tutor
 *
 * Fallback:
 *   - If API credentials are not configured, return the admin-set
 *     classinDefaultRoomName as a deep-link to the ClassIn app.
 *
 * Query params:
 *   - room: string  (lesson video_room_id — used as ClassIn lesson reference)
 *   - topic: string (human-readable lesson title, optional)
 *   - role: 'teacher' | 'student' (default: 'student')
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { adminSupabase } from '@/src/shared/database/supabase';
import {
  VideoProviderConfig,
  DEFAULT_VIDEO_PROVIDER_CONFIG,
  ClassroomJoinResult,
} from '@/src/modules/video/types/videoProviderTypes';

const CLASSIN_API_BASE = 'https://api.classin.com';

/**
 * ClassIn Partner API: Create a classroom/lesson
 * Returns a lessonId (ClassIn's room identifier)
 */
async function createClassInLesson(
  partnerId: string,
  apiKey: string,
  apiSecret: string,
  topic: string,
  roomRef: string
): Promise<{ lessonId: string; joinUrl: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = Math.random().toString(36).substring(2, 12);

  // ClassIn uses HMAC-SHA256 signature: sign(partnerId + timestamp + nonce, apiSecret)
  const signPayload = `${partnerId}${timestamp}${nonce}`;
  const signature = createHmac('sha256', apiSecret).update(signPayload).digest('hex');

  const body = {
    partner_id: partnerId,
    api_key: apiKey,
    timestamp,
    nonce,
    signature,
    lesson_name: topic || `Sabina Live Class — ${roomRef}`,
    lesson_type: 1, // 1-on-1 class
    lesson_start_time: Math.floor(Date.now() / 1000),
    lesson_duration: 60, // minutes — can be parameterised later
    teacher_count: 1,
    student_count: 1,
    ext_lesson_id: roomRef, // Use our lesson room ID as external reference
  };

  const res = await fetch(`${CLASSIN_API_BASE}/v1/lesson/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ClassIn lesson creation failed: ${err}`);
  }

  const data = await res.json();

  if (data.code !== 0) {
    throw new Error(`ClassIn API error: ${data.message || JSON.stringify(data)}`);
  }

  const lessonId = data.data?.lesson_id || data.data?.lessonId;
  // ClassIn generates join URLs per-user; here we return the teacher entry URL
  const joinUrl = data.data?.teacher_url || data.data?.join_url || `https://www.classin.com/lesson/${lessonId}`;

  return { lessonId: String(lessonId), joinUrl };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room') || 'sabina-lesson';
    const topic = searchParams.get('topic') || 'Sabina Live Class';

    // Load stored config
    const { data } = await adminSupabase
      .from('platform_policy_settings')
      .select('video_provider_config')
      .eq('id', 'default')
      .single();

    const config: VideoProviderConfig = {
      ...DEFAULT_VIDEO_PROVIDER_CONFIG,
      ...(data?.video_provider_config || {}),
    };

    // If Partner API credentials are configured, create a dynamic ClassIn lesson
    if (config.classinPartnerId && config.classinApiKey && config.classinApiSecret) {
      const { lessonId, joinUrl } = await createClassInLesson(
        config.classinPartnerId,
        config.classinApiKey,
        config.classinApiSecret,
        topic,
        room
      );

      const result: ClassroomJoinResult = {
        provider: 'classin',
        joinUrl,
        meetingId: lessonId,
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json(result);
    }

    // Fallback: link to ClassIn default room/app
    const fallbackRoom = config.classinDefaultRoomName;
    if (fallbackRoom) {
      const result: ClassroomJoinResult = {
        provider: 'classin',
        joinUrl: `https://www.classin.com/lesson/${fallbackRoom}`,
        meetingId: fallbackRoom,
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'ClassIn is not fully configured. Please set credentials in Admin → Live Classroom settings.' },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('[GET /api/classroom/join/classin]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate ClassIn classroom link' },
      { status: 500 }
    );
  }
}
