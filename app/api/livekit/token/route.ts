/**
 * API Route: GET /api/livekit/token
 * -----------------------------------------------------------------------
 * Generates an authorized LiveKit participant JWT token for joining a room.
 *
 * Auth: Requires a valid session (student or tutor). Verifies the requesting
 * user is a participant in the lesson associated with the room ID.
 *
 * Credentials priority:
 *   1. DB video_provider_config (set via Admin → Live Classroom settings)
 *   2. LIVEKIT_API_KEY / LIVEKIT_API_SECRET env vars (fallback)
 *
 * Query params:
 *  - room: string  (e.g. "room-sabina-xxxxxxxx-xxxx-...")
 *  - username: string (display name shown in the room)
 *  - identity: string (optional — defaults to a timestamp-based ID)
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getPlatformPolicies } from '@/src/shared/config/platformPolicies';

// ─── Resolve Livekit credentials ──────────────────────────────────────────────

async function getLivekitCredentials(): Promise<{ apiKey: string; apiSecret: string; serverUrl: string }> {
  // 1. Try DB-stored admin config first
  try {
    const { data } = await adminSupabase
      .from('platform_policy_settings')
      .select('video_provider_config')
      .eq('id', 'default')
      .single();

    const cfg = data?.video_provider_config;
    if (
      cfg?.activeProvider === 'livekit' &&
      cfg?.livekitApiKey &&
      cfg?.livekitApiSecret &&
      cfg?.livekitApiKey !== '' &&
      cfg?.livekitApiSecret !== ''
    ) {
      return {
        apiKey: cfg.livekitApiKey,
        apiSecret: cfg.livekitApiSecret,
        serverUrl: cfg.livekitUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud',
      };
    }
  } catch {
    // fall through to env vars
  }

  // 2. Fall back to environment variables
  return {
    apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
    apiSecret: process.env.LIVEKIT_API_SECRET || 'secret777888999000',
    serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud',
  };
}

// ─── Verify the requesting user belongs to this room ─────────────────────────

async function verifyRoomParticipant(
  roomId: string,
  userId: string
): Promise<{ allowed: boolean; identity: string; displayName: string; isStudent?: boolean; scheduledStart?: string | null }> {
  if (!userId) {
    return { allowed: false, identity: '', displayName: '', isStudent: false, scheduledStart: null };
  }

  // Look up the lesson by video_room_id; check student or tutor match
  const { data: lesson } = await adminSupabase
    .from('lessons')
    .select(`
      id,
      student_id,
      video_room_id,
      scheduled_start,
      bookings!inner (
        tutor_id,
        tutors!inner (
          user_id
        )
      )
    `)
    .eq('video_room_id', roomId)
    .single();

  if (!lesson) {
    // Room not found in DB — allow in dev environments with demo keys
    const isDev = (process.env.LIVEKIT_API_KEY || '') === 'devkey';
    return {
      allowed: isDev,
      identity: userId,
      displayName: 'Participant',
      isStudent: false,
      scheduledStart: null,
    };
  }

  const tutorUserId = (lesson.bookings as any)?.tutors?.user_id;
  const isStudent = lesson.student_id === userId;
  const isTutor = tutorUserId === userId;

  return {
    allowed: isStudent || isTutor,
    identity: userId,
    displayName: isStudent ? 'Student' : isTutor ? 'Tutor' : 'Participant',
    isStudent,
    scheduledStart: lesson.scheduled_start,
  };
}

// ─── GET Handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room');
    const username = searchParams.get('username') || 'Participant';
    const identityParam = searchParams.get('identity');

    if (!room) {
      return NextResponse.json({ error: 'Query parameter "room" is required.' }, { status: 400 });
    }

    // Read user identity from middleware-injected header (set by middleware.ts)
    const userId = req.headers.get('x-auth-user-id') || identityParam || `anon-${Date.now()}`;

    // Verify participant
    const { allowed, identity, displayName, isStudent, scheduledStart } = await verifyRoomParticipant(room, userId);

    if (!allowed) {
      return NextResponse.json(
        { error: 'You are not a participant in this classroom session.' },
        { status: 403 }
      );
    }

    if (isStudent && scheduledStart) {
      const policies = await getPlatformPolicies();
      const earlyJoinMinutes = policies.classroomEarlyJoinMinutes || 15;
      const scheduledTime = new Date(scheduledStart).getTime();
      const now = Date.now();
      
      const thresholdTime = scheduledTime - (earlyJoinMinutes * 60 * 1000);
      if (now < thresholdTime) {
        return NextResponse.json(
          { error: `The classroom will open ${earlyJoinMinutes} minutes before the scheduled start time.` },
          { status: 403 }
        );
      }
    }

    // Resolve credentials
    const { apiKey, apiSecret, serverUrl } = await getLivekitCredentials();

    // Generate JWT token
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: username || displayName,
      ttl: '2h',
    });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      serverUrl,
      room,
      identity,
      username: username || displayName,
    });

  } catch (error: any) {
    console.error('[GET /api/livekit/token]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
