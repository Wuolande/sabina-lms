-- Migration 035: Platform SEO, Metadata & Asset Management
-- Adds fields for favicon, apple-touch-icon, OpenGraph social card, meta tags, and indexing control to platform_theme.

ALTER TABLE public.platform_theme
  ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS apple_touch_icon_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS og_image_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT 'Sabina Edge | Premium 1-on-1 Online Tutoring & Live Classroom',
  ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT 'Connect with certified, elite private tutors for 1-on-1 live video lessons in languages, STEM, coding, and exam prep.',
  ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '["online tutoring", "private tutor", "learn languages", "math tutor", "python coding", "live classroom", "ielts prep"]'::jsonb,
  ADD COLUMN IF NOT EXISTS google_site_verification TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bing_site_verification TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS twitter_handle TEXT DEFAULT '@SabinaLMS',
  ADD COLUMN IF NOT EXISTS allow_indexing BOOLEAN DEFAULT true;

-- Update existing default record if empty
UPDATE public.platform_theme
SET
  meta_title = COALESCE(NULLIF(meta_title, ''), 'Sabina Edge | Premium 1-on-1 Online Tutoring & Live Classroom'),
  meta_description = COALESCE(NULLIF(meta_description, ''), 'Connect with certified, elite private tutors for 1-on-1 live video lessons in languages, STEM, coding, and exam prep.'),
  keywords = COALESCE(keywords, '["online tutoring", "private tutor", "learn languages", "math tutor", "python coding", "live classroom", "ielts prep"]'::jsonb),
  twitter_handle = COALESCE(NULLIF(twitter_handle, ''), '@SabinaLMS'),
  allow_indexing = COALESCE(allow_indexing, true)
WHERE id = 'default';
