-- ====================================================================
-- MIGRATION 010: Tutor Schedule Settings, Exceptions & 360 Stored Function
-- ====================================================================

-- 1. Tutor Schedule Settings Table
CREATE TABLE IF NOT EXISTS public.tutor_schedule_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL UNIQUE REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    buffer_minutes INT NOT NULL DEFAULT 10 CHECK (buffer_minutes IN (0, 5, 10, 15, 30)),
    min_notice_hours INT NOT NULL DEFAULT 4 CHECK (min_notice_hours IN (1, 2, 4, 12, 24, 48)),
    max_advance_days INT NOT NULL DEFAULT 30 CHECK (max_advance_days IN (7, 14, 30, 60, 90)),
    default_lesson_duration INT NOT NULL DEFAULT 50 CHECK (default_lesson_duration IN (25, 50, 75, 80)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_settings_tutor ON public.tutor_schedule_settings(tutor_id);

-- 2. Add columns to tutor_availability_exceptions if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_availability_exceptions' AND column_name = 'start_time') THEN
        ALTER TABLE public.tutor_availability_exceptions ADD COLUMN start_time TIME;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_availability_exceptions' AND column_name = 'end_time') THEN
        ALTER TABLE public.tutor_availability_exceptions ADD COLUMN end_time TIME;
    END IF;
END $$;

-- 3. Trigger for updated_at
DROP TRIGGER IF EXISTS trg_schedule_settings_updated_at ON public.tutor_schedule_settings;
CREATE TRIGGER trg_schedule_settings_updated_at
    BEFORE UPDATE ON public.tutor_schedule_settings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Enable RLS
ALTER TABLE public.tutor_schedule_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schedule_settings_all ON public.tutor_schedule_settings;
CREATE POLICY schedule_settings_all ON public.tutor_schedule_settings FOR ALL USING (true);

-- 5. Stored Procedure: get_tutor_schedule_360
CREATE OR REPLACE FUNCTION public.get_tutor_schedule_360(p_tutor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'tutorId', p_tutor_id,
        'settings', COALESCE((
            SELECT jsonb_build_object(
                'bufferMinutes', tss.buffer_minutes,
                'minNoticeHours', tss.min_notice_hours,
                'maxAdvanceDays', tss.max_advance_days,
                'defaultLessonDuration', tss.default_lesson_duration
            )
            FROM public.tutor_schedule_settings tss
            WHERE tss.tutor_id = p_tutor_id
            LIMIT 1
        ), jsonb_build_object(
            'bufferMinutes', 10,
            'minNoticeHours', 4,
            'maxAdvanceDays', 30,
            'defaultLessonDuration', 50
        )),
        'rules', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', tar.id,
                'dayOfWeek', tar.day_of_week,
                'startTime', tar.start_time,
                'endTime', tar.end_time,
                'isActive', tar.is_active
            ) ORDER BY tar.day_of_week ASC)
            FROM public.tutor_availability_rules tar
            WHERE tar.tutor_id = p_tutor_id
        ), '[]'::jsonb),
        'exceptions', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', tae.id,
                'date', tae.date,
                'isBlocked', tae.is_blocked,
                'startTime', tae.start_time,
                'endTime', tae.end_time,
                'reason', tae.reason,
                'createdAt', tae.created_at
            ) ORDER BY tae.date ASC)
            FROM public.tutor_availability_exceptions tae
            WHERE tae.tutor_id = p_tutor_id
        ), '[]'::jsonb),
        'upcomingLessons', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', l.id,
                'bookingId', l.booking_id,
                'bookingRef', b.booking_ref,
                'studentId', su.id,
                'studentName', su.display_name,
                'studentEmail', su.email,
                'studentAvatar', su.avatar_url,
                'subjectName', COALESCE(b.subject_name, 'General Tutoring'),
                'scheduledStart', l.scheduled_start,
                'scheduledEnd', l.scheduled_end,
                'status', l.status,
                'videoRoomId', l.video_room_id,
                'lessonNotes', l.lesson_notes
            ) ORDER BY l.scheduled_start ASC)
            FROM public.lessons l
            JOIN public.bookings b ON b.id = l.booking_id
            JOIN public.users su ON su.id = l.student_id
            WHERE l.tutor_id = p_tutor_id
              AND l.status IN ('SCHEDULED', 'LIVE')
        ), '[]'::jsonb)
    )
    INTO result;

    RETURN result;
END;
$$;
