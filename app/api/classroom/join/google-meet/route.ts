/**
 * API Route: GET /api/classroom/join/google-meet
 * -----------------------------------------------------------------------
 * Generates a Google Meet join URL for a given lesson.
 *
 * Flow (Google Calendar API + Meet):
 *   1. Use Google Service Account or OAuth client credentials to
 *      create a Google Calendar event with a Meet conferencing link
 *   2. Return the Meet join URL from the event's conferenceData
 *
 * Fallback:
 *   - If API credentials are not configured, return the admin-set
 *     googleMeetDefaultLink as the join URL.
 *
 * Query params:
 *   - room: string  (lesson video_room_id)
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

/**
 * Exchange Google service account / OAuth credentials for an access token.
 * Uses the Google OAuth 2.0 token endpoint with a JWT assertion
 * (Service Account flow).
 */
async function getGoogleAccessToken(clientId: string, clientSecret: string): Promise<string> {
  // For OAuth 2.0 Client Credentials (Service Account / Web App OAuth)
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://www.googleapis.com/auth/calendar.events',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google OAuth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Create a Google Calendar event with Google Meet conferencing attached.
 * Returns the Meet join URL.
 */
async function createGoogleMeet(
  accessToken: string,
  topic: string,
  roomRef: string
): Promise<{ joinUrl: string; meetingId: string }> {
  const now = new Date();
  const end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

  const requestId = `sabina-${roomRef}-${Date.now()}`;

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: topic || `Sabina Live Class — ${roomRef}`,
        start: { dateTime: now.toISOString() },
        end: { dateTime: end.toISOString() },
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar event creation failed: ${err}`);
  }

  const event = await res.json();
  const meetLink = event.conferenceData?.entryPoints?.find(
    (ep: any) => ep.entryPointType === 'video'
  )?.uri;

  const meetingId = event.conferenceData?.conferenceId || requestId;

  if (!meetLink) {
    throw new Error('Google Meet link was not returned in the Calendar event response.');
  }

  return { joinUrl: meetLink, meetingId };
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

    // If Google OAuth credentials are configured, create a dynamic Meet link
    if (config.googleClientId && config.googleClientSecret) {
      try {
        const accessToken = await getGoogleAccessToken(config.googleClientId, config.googleClientSecret);
        const { joinUrl, meetingId } = await createGoogleMeet(accessToken, topic, room);

        const result: ClassroomJoinResult = {
          provider: 'google_meet',
          joinUrl,
          meetingId,
          generatedAt: new Date().toISOString(),
        };
        return NextResponse.json(result);
      } catch (apiErr: any) {
        console.warn('[GET /api/classroom/join/google-meet] API call failed, using fallback:', apiErr.message);
        // Fall through to default link
      }
    }

    // Fallback: return admin-configured default Meet link
    const fallbackUrl = config.googleMeetDefaultLink;
    if (fallbackUrl) {
      const result: ClassroomJoinResult = {
        provider: 'google_meet',
        joinUrl: fallbackUrl,
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Google Meet is not fully configured. Please set credentials in Admin → Live Classroom settings.' },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('[GET /api/classroom/join/google-meet]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Google Meet link' },
      { status: 500 }
    );
  }
}
