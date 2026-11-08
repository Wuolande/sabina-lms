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
 *  - identity: string (optional — defaults to authenticated user ID)
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getPlatformPolicies } from '@/src/shared/config/platformPolicies';
import { getAuthenticatedCaller } from '@/src/shared/auth/authService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  userId: string,
  isAdmin: boolean = false
): Promise<{
  allowed: boolean;
  identity: string;
  displayName: string;
  isStudent?: boolean;
  isTutor?: boolean;
  scheduledStart?: string | null;
}> {
  if (!userId) {
    return { allowed: false, identity: '', displayName: '', isStudent: false, isTutor: false, scheduledStart: null };
  }

  // Look up the lesson safely: only query id.eq if cleanId is a valid UUID
  const cleanId = roomId.replace(/^room-/, '');
  const isCleanUuid = UUID_REGEX.test(cleanId);

  let query = adminSupabase
    .from('lessons')
    .select(`
      id,
      student_id,
      video_room_id,
      scheduled_start,
      tutor:tutor_profiles!lessons_tutor_id_fkey(user_id)
    `);

  if (isCleanUuid) {
    query = query.or(`video_room_id.eq.${roomId},id.eq.${cleanId}`);
  } else {
    query = query.eq('video_room_id', roomId);
  }

  const { data: lesson } = await query.maybeSingle();

  if (!lesson) {
    return {
      allowed: true,
      identity: userId,
      displayName: 'Participant',
      isStudent: false,
      isTutor: isAdmin,
      scheduledStart: null,
    };
  }

  const tutorUserId = (lesson.tutor as any)?.user_id;
  const isStudent = lesson.student_id === userId;
  const isTutor = tutorUserId === userId || isAdmin;

  return {
    allowed: isStudent || isTutor || userId.startsWith('anon-'),
    identity: userId,
    displayName: isTutor ? 'Tutor' : isStudent ? 'Student' : 'Participant',
    isStudent,
    isTutor,
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

    // Resolve authenticated user from session cookies or header/query fallback
    let userId = req.headers.get('x-auth-user-id') || identityParam || '';
    let callerDisplayName = username;
    let isAdmin = false;

    try {
      const caller = await getAuthenticatedCaller(req);
      if (caller?.userId) {
        userId = caller.userId;
        isAdmin = !!caller.isAdmin;
        if (!searchParams.get('username') && caller.displayName) {
          callerDisplayName = caller.displayName;
        }
      }
    } catch {
      // Fallback if session check fails
    }

    if (!userId) {
      userId = `anon-${Date.now()}`;
    }

    // Verify participant
    const { allowed, identity, displayName, isStudent, isTutor, scheduledStart } = await verifyRoomParticipant(
      room,
      userId,
      isAdmin
    );

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

      const thresholdTime = scheduledTime - earlyJoinMinutes * 60 * 1000;
      if (now < thresholdTime) {
        return NextResponse.json(
          { error: `The classroom will open ${earlyJoinMinutes} minutes before the scheduled start time.` },
          { status: 403 }
        );
      }
    }

    // Resolve credentials
    const { apiKey, apiSecret, serverUrl } = await getLivekitCredentials();

    // Generate JWT token with role-based host grants
    const isHost = !!isTutor;
    const finalName = callerDisplayName || displayName;
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: finalName,
      ttl: '4h',
      metadata: JSON.stringify({
        role: isHost ? 'TUTOR' : 'STUDENT',
        userId,
        displayName: finalName,
      }),
    });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost,
      canUpdateOwnMetadata: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      serverUrl,
      room,
      identity,
      username: finalName,
    });
  } catch (error: any) {
    console.error('[GET /api/livekit/token]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
