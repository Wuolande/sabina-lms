/**
 * API Route: GET /api/livekit/token
 * -----------------------------------------------------------------------
 * Generates an authorized LiveKit participant JWT token for joining a video room.
 * Query params:
 *  - room: string (e.g. "room-sabina-ielts-001")
 *  - username: string (e.g. "Alex Rivera")
 *  - identity: string (e.g. user ID)
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret777888999000';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room');
    const username = searchParams.get('username') || 'Participant';
    const identity = searchParams.get('identity') || `user-${Date.now()}`;

    if (!room) {
      return NextResponse.json({ error: 'Query parameter "room" is required.' }, { status: 400 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: username,
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
      serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud',
      room,
      identity,
      username,
    });

  } catch (error: any) {
    console.error('[GET /api/livekit/token]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
