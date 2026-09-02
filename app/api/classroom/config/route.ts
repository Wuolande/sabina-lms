/**
 * API Route: GET /api/classroom/config
 * -----------------------------------------------------------------------
 * Public endpoint (no auth) that returns the active classroom provider
 * and non-secret configuration for the classroom page to bootstrap with.
 *
 * NOTE: This route NEVER returns API keys or secrets.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import {
  VideoProviderConfig,
  DEFAULT_VIDEO_PROVIDER_CONFIG,
  ClassroomProviderConfig,
} from '@/src/modules/video/types/videoProviderTypes';

// Cache the provider config for 60 seconds to avoid DB reads on every page load
let cache: { data: ClassroomProviderConfig; expiresAt: number } | null = null;

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();

    // Return cached value if still fresh
    if (cache && cache.expiresAt > now) {
      return NextResponse.json(cache.data);
    }

    const { data, error } = await adminSupabase
      .from('platform_policy_settings')
      .select('video_provider_config')
      .eq('id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('[GET /api/classroom/config]', error.message);
    }

    const config: VideoProviderConfig = {
      ...DEFAULT_VIDEO_PROVIDER_CONFIG,
      ...(data?.video_provider_config || {}),
    };

    // Only expose non-secret fields
    const safeConfig: ClassroomProviderConfig = {
      activeProvider: config.activeProvider,
      // Only return the Livekit URL (not key/secret — those stay server-side)
      ...(config.activeProvider === 'livekit' && {
        livekitUrl: config.livekitUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud',
      }),
    };

    cache = { data: safeConfig, expiresAt: now + 60_000 }; // 60s cache

    return NextResponse.json(safeConfig);
  } catch (error: any) {
    console.error('[GET /api/classroom/config]', error);
    // Fall back to Livekit defaults on error so the classroom still works
    return NextResponse.json({
      activeProvider: 'livekit',
      livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud',
    } as ClassroomProviderConfig);
  }
}
