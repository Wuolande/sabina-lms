-- ====================================================================
-- MIGRATION 007: Notifications, Auth Profile Sync & Additional Indexes
-- ====================================================================
-- Purpose: Creates notifications table, auto sync trigger between auth.users
-- and public.users, admin_stats_view, and specialized indexes for full-text
-- search and performance on application review queues.
--
-- Migration notes:
--  - Idempotent script: safe to re-run on any Supabase instance.
-- ====================================================================

-- Section A: Tutor Notifications Table
CREATE TABLE IF NOT EXISTS public.tutor_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    sent_via VARCHAR(50)[] DEFAULT '{}'::varchar[],
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.tutor_notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.tutor_notifications(created_at DESC);

-- Section B: Auth Profile Sync Function
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_display_name TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
BEGIN
    v_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name',
        SPLIT_PART(NEW.email, '@', 1)
    );
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(v_display_name, ' ', 1));
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', SPLIT_PART(v_display_name, ' ', 2));

    INSERT INTO public.users (auth_id, email, first_name, last_name, display_name, status)
    VALUES (
        NEW.id,
        NEW.email,
        v_first_name,
        COALESCE(NULLIF(v_last_name, ''), 'User'),
        v_display_name,
        'ACTIVE'
    )
    ON CONFLICT (auth_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Trigger: fire on every new auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Section C: Admin Stats Helper View
CREATE OR REPLACE VIEW public.admin_stats_view AS
SELECT
    (SELECT COUNT(*) FROM public.users WHERE deleted_at IS NULL) AS total_users,
    (SELECT COUNT(*) FROM public.user_roles WHERE role_id = 'STUDENT') AS total_students,
    (SELECT COUNT(*) FROM public.user_roles WHERE role_id = 'TUTOR') AS total_tutors,
    (SELECT COUNT(*) FROM public.tutor_profiles WHERE account_status = 'ACTIVE') AS active_tutors,
    (SELECT COUNT(*) FROM public.tutor_applications WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'REQUESTED_CHANGES', 'RESUBMITTED')) AS pending_tutor_applications,
    (SELECT COUNT(*) FROM public.audit_logs WHERE action LIKE 'TUTOR_%' AND created_at > NOW() - INTERVAL '30 days') AS recent_tutor_actions;

-- Section D: Partial index for pending application queue (performance)
CREATE INDEX IF NOT EXISTS idx_tutor_apps_pending_queue
    ON public.tutor_applications(submitted_at DESC)
    WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'REQUESTED_CHANGES', 'RESUBMITTED');

-- Section E: Full-text search index on tutor profiles
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_fts
    ON public.tutor_profiles USING gin(
        to_tsvector('english', COALESCE(headline, '') || ' ' || COALESCE(bio, ''))
    );

-- Section F: Full-text search index on users display name
CREATE INDEX IF NOT EXISTS idx_users_display_name_fts
    ON public.users USING gin(to_tsvector('english', display_name));

-- Section G: Application status count helper function
CREATE OR REPLACE FUNCTION public.get_application_status_counts()
RETURNS JSONB
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
    SELECT jsonb_object_agg(status, cnt)
    FROM (
        SELECT status, COUNT(*) AS cnt
        FROM public.tutor_applications
        GROUP BY status
    ) t;
$$;
