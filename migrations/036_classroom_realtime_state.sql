-- ====================================================================
-- MIGRATION 036: Classroom Real-Time Whiteboard, Notes & Chat State Persistence
-- ====================================================================

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS whiteboard_state JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS chat_messages JSONB DEFAULT '[]'::jsonb;
