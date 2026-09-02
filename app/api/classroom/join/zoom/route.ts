/**
 * API Route: GET /api/classroom/join/zoom
 * -----------------------------------------------------------------------
 * Generates or retrieves a Zoom meeting join URL for a given lesson.
 *
 * Flow (Server-to-Server OAuth mode):
 *   1. Exchange Account ID + Client ID + Client Secret for an access token
 *   2. Create (or retrieve) a Zoom meeting for this lesson room
 *   3. Return the join_url
 *
 * Flow (fallback):
 *   - If API credentials are not configured, return the admin-set
 *     zoomDefaultMeetingUrl as the join URL.
 *
 * Query params:
 *   - room: string  (lesson video_room_id — used as Zoom meeting topic/ID ref)
 *   - topic: string (human-readable lesson title, optional)
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import {
  VideoProviderConfig,
  DEFAULT_VIDEO_PROVIDER_CONFIG,
  ClassroomJoinResult,
} from '@/src/modules/video/types/videoProviderTypes';

/** Fetch Zoom S2S OAuth access token */
async function getZoomAccessToken(accountId: string, clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom OAuth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

/** Create a Zoom meeting and return the join_url */
async function createZoomMeeting(
  accessToken: string,
  topic: string,
  roomRef: string
): Promise<{ joinUrl: string; meetingId: string }> {
  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: topic || `Sabina Live Class — ${roomRef}`,
      type: 1, // Instant meeting
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: false,
        auto_recording: 'none',
        waiting_room: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom meeting creation failed: ${err}`);
  }

  const data = await res.json();
  return { joinUrl: data.join_url, meetingId: String(data.id) };
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

    // If full OAuth credentials are configured, create a dynamic meeting
    if (
      config.zoomAccountId &&
      config.zoomApiKey &&
      config.zoomApiSecret &&
      config.zoomSdkMode === 'oauth'
    ) {
      const accessToken = await getZoomAccessToken(
        config.zoomAccountId,
        config.zoomApiKey,
        config.zoomApiSecret
      );
      const { joinUrl, meetingId } = await createZoomMeeting(accessToken, topic, room);

      const result: ClassroomJoinResult = {
        provider: 'zoom',
        joinUrl,
        meetingId,
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json(result);
    }

    // Fallback: return the admin-configured default Zoom meeting URL
    const fallbackUrl = config.zoomDefaultMeetingUrl;
    if (fallbackUrl) {
      const result: ClassroomJoinResult = {
        provider: 'zoom',
        joinUrl: fallbackUrl,
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Zoom is not fully configured. Please set credentials in Admin → Live Classroom settings.' },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('[GET /api/classroom/join/zoom]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Zoom meeting link' },
      { status: 500 }
    );
  }
}
