-- ====================================================================
-- MIGRATION 028: Video Provider Configuration
-- ====================================================================
-- Adds video_provider_config JSONB column to platform_policy_settings
-- to store live classroom provider settings (Livekit, Zoom, ClassIn, Google Meet).
-- ====================================================================

-- 1. Add video_provider_config column if it doesn't already exist
ALTER TABLE public.platform_policy_settings
  ADD COLUMN IF NOT EXISTS video_provider_config JSONB NOT NULL DEFAULT '{}'::JSONB;

-- 2. Seed the default config if the 'default' row exists and has no video config yet
UPDATE public.platform_policy_settings
SET video_provider_config = '{
  "activeProvider": "livekit",
  "livekitApiKey": "",
  "livekitApiSecret": "",
  "livekitUrl": "",
  "classinApiKey": "",
  "classinApiSecret": "",
  "classinPartnerId": "",
  "classinDefaultRoomName": "",
  "zoomApiKey": "",
  "zoomApiSecret": "",
  "zoomAccountId": "",
  "zoomSdkMode": "oauth",
  "zoomDefaultMeetingUrl": "",
  "googleClientId": "",
  "googleClientSecret": "",
  "googleMeetDefaultLink": ""
}'::JSONB
WHERE id = 'default'
  AND (video_provider_config IS NULL OR video_provider_config = '{}'::JSONB);

-- 3. Insert default row if no settings row exists yet
INSERT INTO public.platform_policy_settings (id, video_provider_config)
VALUES (
  'default',
  '{
    "activeProvider": "livekit",
    "livekitApiKey": "",
    "livekitApiSecret": "",
    "livekitUrl": "",
    "classinApiKey": "",
    "classinApiSecret": "",
    "classinPartnerId": "",
    "classinDefaultRoomName": "",
    "zoomApiKey": "",
    "zoomApiSecret": "",
    "zoomAccountId": "",
    "zoomSdkMode": "oauth",
    "zoomDefaultMeetingUrl": "",
    "googleClientId": "",
    "googleClientSecret": "",
    "googleMeetDefaultLink": ""
  }'::JSONB
)
ON CONFLICT (id) DO NOTHING;

-- 4. Index for faster reads (platform has only 1 row but good practice)
CREATE INDEX IF NOT EXISTS idx_platform_policy_settings_provider
  ON public.platform_policy_settings ((video_provider_config->>'activeProvider'));
