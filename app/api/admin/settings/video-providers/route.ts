/**
 * API Route: GET & PUT /api/admin/settings/video-providers
 * -----------------------------------------------------------------------
 * Manages live classroom provider credentials (Livekit, ClassIn,
 * Google Meet, Zoom) and the active provider selection.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAdminContext } from '@/src/shared/auth/authService';
import {
  VideoProviderConfig,
  DEFAULT_VIDEO_PROVIDER_CONFIG,
} from '@/src/modules/video/types/videoProviderTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mask a secret key so the UI shows e.g. "6f3a••••••••e9c2" */
const maskKey = (key?: string): string => {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return `${key.substring(0, 4)}••••••••${key.slice(-4)}`;
};

/** Return original if incoming is empty/masked, else return incoming */
const unmaskOrKeep = (incoming?: string, original?: string): string => {
  if (!incoming || incoming.includes('••••')) return original || '';
  return incoming;
};

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await getAdminContext(req);

    const { data, error } = await adminSupabase
      .from('platform_policy_settings')
      .select('video_provider_config')
      .eq('id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('[GET /api/admin/settings/video-providers]', error.message);
    }

    const merged: VideoProviderConfig = {
      ...DEFAULT_VIDEO_PROVIDER_CONFIG,
      ...(data?.video_provider_config || {}),
    };

    // Return masked secrets for safe rendering in the admin UI
    return NextResponse.json({
      ...merged,
      livekitApiSecretMasked: maskKey(merged.livekitApiSecret),
      classinApiSecretMasked: maskKey(merged.classinApiSecret),
      zoomApiSecretMasked: maskKey(merged.zoomApiSecret),
      googleClientSecretMasked: maskKey(merged.googleClientSecret),
    });
  } catch (error: any) {
    console.error('[GET /api/admin/settings/video-providers]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    const body = await req.json();

    // Fetch existing config to preserve secrets that were not changed
    const { data: existingData } = await adminSupabase
      .from('platform_policy_settings')
      .select('video_provider_config')
      .eq('id', 'default')
      .single();

    const current: VideoProviderConfig =
      existingData?.video_provider_config || DEFAULT_VIDEO_PROVIDER_CONFIG;

    const updatedConfig: VideoProviderConfig = {
      ...DEFAULT_VIDEO_PROVIDER_CONFIG,
      ...body,
      // Unmask or preserve secrets
      livekitApiSecret: unmaskOrKeep(body.livekitApiSecret, current.livekitApiSecret),
      classinApiSecret: unmaskOrKeep(body.classinApiSecret, current.classinApiSecret),
      zoomApiSecret: unmaskOrKeep(body.zoomApiSecret, current.zoomApiSecret),
      googleClientSecret: unmaskOrKeep(body.googleClientSecret, current.googleClientSecret),
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email || 'Admin',
    };

    const { error } = await adminSupabase
      .from('platform_policy_settings')
      .upsert({
        id: 'default',
        video_provider_config: updatedConfig,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(error.message);
    }

    // Record audit log
    await adminSupabase.from('audit_logs').insert({
      actor_user_id: admin.id,
      action: 'UPDATE_VIDEO_PROVIDER_CONFIG',
      entity_type: 'VIDEO_PROVIDER',
      entity_id: 'default',
      metadata: {
        activeProvider: updatedConfig.activeProvider,
        livekitUrl: updatedConfig.livekitUrl,
        zoomSdkMode: updatedConfig.zoomSdkMode,
      },
    });

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error: any) {
    console.error('[PUT /api/admin/settings/video-providers]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
