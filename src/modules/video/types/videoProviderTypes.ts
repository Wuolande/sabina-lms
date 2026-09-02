/**
 * Video Provider Configuration Types
 * -----------------------------------------------------------------------
 * Supports Livekit (native WebRTC), ClassIn, Google Meet, and Zoom
 * as live classroom providers for 1-on-1 and group sessions.
 * -----------------------------------------------------------------------
 */

/** The four supported live classroom providers */
export type VideoProviderType = 'livekit' | 'classin' | 'google_meet' | 'zoom';

export interface VideoProviderConfig {
  /** Which provider is currently active platform-wide */
  activeProvider: VideoProviderType;

  // ─── Livekit ─────────────────────────────────────────────────────────
  /** Livekit API key (server-side only) */
  livekitApiKey?: string;
  /** Livekit API secret (server-side only) */
  livekitApiSecret?: string;
  /** Livekit WebSocket server URL, e.g. wss://your-livekit-server.com */
  livekitUrl?: string;

  // ─── ClassIn ─────────────────────────────────────────────────────────
  /** ClassIn Partner API key */
  classinApiKey?: string;
  /** ClassIn Partner API secret */
  classinApiSecret?: string;
  /** ClassIn Partner ID issued by ClassIn */
  classinPartnerId?: string;
  /**
   * Fallback ClassIn room name used when no room has been
   * pre-created for a lesson (optional)
   */
  classinDefaultRoomName?: string;

  // ─── Zoom ─────────────────────────────────────────────────────────────
  /**
   * Zoom SDK Key (Web SDK) or OAuth Client ID (Server-to-Server OAuth)
   * depending on zoomSdkMode
   */
  zoomApiKey?: string;
  /**
   * Zoom SDK Secret (Web SDK) or OAuth Client Secret (Server-to-Server OAuth)
   */
  zoomApiSecret?: string;
  /** Zoom Server-to-Server OAuth Account ID */
  zoomAccountId?: string;
  /** Whether to use Zoom Web SDK (embedded) or OAuth meeting URL */
  zoomSdkMode?: 'web_sdk' | 'oauth';
  /**
   * Optional fallback/default recurring Zoom meeting URL used when
   * the API cannot dynamically create a unique meeting per lesson.
   * Leave blank to always use dynamic meeting creation.
   */
  zoomDefaultMeetingUrl?: string;

  // ─── Google Meet ──────────────────────────────────────────────────────
  /**
   * Google OAuth 2.0 Client ID (for Calendar API + Meet integration).
   * Create a Service Account credential at console.cloud.google.com.
   */
  googleClientId?: string;
  /**
   * Google OAuth 2.0 Client Secret / Service Account private key JSON
   */
  googleClientSecret?: string;
  /**
   * Fallback Google Meet link (e.g. a recurring Meet room) used when
   * the API cannot dynamically create a unique meeting per lesson.
   * Leave blank to always use dynamic meeting creation.
   */
  googleMeetDefaultLink?: string;

  updatedAt?: string;
  updatedBy?: string;

  // ─── Masked fields (returned by GET API only — never stored) ──────────────
  /** Server-masked version of livekitApiSecret for safe rendering in admin UI */
  livekitApiSecretMasked?: string;
  /** Server-masked version of classinApiSecret for safe rendering in admin UI */
  classinApiSecretMasked?: string;
  /** Server-masked version of zoomApiSecret for safe rendering in admin UI */
  zoomApiSecretMasked?: string;
  /** Server-masked version of googleClientSecret for safe rendering in admin UI */
  googleClientSecretMasked?: string;
}

export const DEFAULT_VIDEO_PROVIDER_CONFIG: VideoProviderConfig = {
  activeProvider: 'livekit',
  livekitApiKey: '',
  livekitApiSecret: '',
  livekitUrl: '',
  classinApiKey: '',
  classinApiSecret: '',
  classinPartnerId: '',
  classinDefaultRoomName: '',
  zoomApiKey: '',
  zoomApiSecret: '',
  zoomAccountId: '',
  zoomSdkMode: 'oauth',
  zoomDefaultMeetingUrl: '',
  googleClientId: '',
  googleClientSecret: '',
  googleMeetDefaultLink: '',
};

/** What the classroom page receives from /api/classroom/config */
export interface ClassroomProviderConfig {
  activeProvider: VideoProviderType;
  /** Only present when activeProvider === 'livekit' */
  livekitUrl?: string;
}

/** What the join routes return for external providers */
export interface ClassroomJoinResult {
  provider: VideoProviderType;
  /** URL the user should be redirected/linked to in order to join the meeting */
  joinUrl: string;
  /** Human-readable meeting identifier (room ID, meeting ID, etc.) */
  meetingId?: string;
  /** ISO timestamp when this join link was created / expires */
  generatedAt: string;
  /** Error message if join URL generation failed */
  error?: string;
}
