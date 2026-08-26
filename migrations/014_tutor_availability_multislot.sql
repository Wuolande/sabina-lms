-- ====================================================================
-- MIGRATION 014: Tutor Availability Multi-Slot & Atomic Persistence
-- ====================================================================

-- 1. Stored Procedure: save_tutor_availability_atomic
CREATE OR REPLACE FUNCTION public.save_tutor_availability_atomic(
    p_tutor_id UUID,
    p_rules JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r JSONB;
    v_day INT;
    v_start TIME;
    v_end TIME;
    v_active BOOLEAN;
BEGIN
    -- Delete existing rules for this tutor
    DELETE FROM public.tutor_availability_rules
    WHERE tutor_id = p_tutor_id;

    -- Insert new rules
    FOR r IN SELECT * FROM jsonb_array_elements(p_rules)
    LOOP
        v_day := (r->>'dayOfWeek')::INT;
        v_start := (r->>'startTime')::TIME;
        v_end := (r->>'endTime')::TIME;
        v_active := COALESCE((r->>'isActive')::BOOLEAN, true);

        IF v_active AND v_start < v_end THEN
            INSERT INTO public.tutor_availability_rules (
                tutor_id,
                day_of_week,
                start_time,
                end_time,
                is_active
            ) VALUES (
                p_tutor_id,
                v_day,
                v_start,
                v_end,
                true
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'count', jsonb_array_length(p_rules));
END;
$$;

-- 2. Enhanced get_tutor_schedule_360
CREATE OR REPLACE FUNCTION public.get_tutor_schedule_360(p_tutor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings RECORD;
    v_rules JSONB;
    v_exceptions JSONB;
    v_upcoming JSONB;
    result JSONB;
BEGIN
    -- 1. Fetch or initialize settings
    SELECT * INTO v_settings
    FROM public.tutor_schedule_settings
    WHERE tutor_id = p_tutor_id;

    IF NOT FOUND THEN
        INSERT INTO public.tutor_schedule_settings (tutor_id)
        VALUES (p_tutor_id)
        RETURNING * INTO v_settings;
    END IF;

    -- 2. Fetch multi-slot availability rules
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ar.id,
        'tutorId', ar.tutor_id,
        'dayOfWeek', ar.day_of_week,
        'startTime', ar.start_time::TEXT,
        'endTime', ar.end_time::TEXT,
        'isActive', ar.is_active
    ) ORDER BY ar.day_of_week ASC, ar.start_time ASC), '[]'::jsonb)
    INTO v_rules
    FROM public.tutor_availability_rules ar
    WHERE ar.tutor_id = p_tutor_id;

    -- 3. Fetch exceptions (time-off)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ex.id,
        'tutorId', ex.tutor_id,
        'date', ex.date,
        'isBlocked', ex.is_blocked,
        'startTime', ex.start_time::TEXT,
        'endTime', ex.end_time::TEXT,
        'reason', ex.reason,
        'createdAt', ex.created_at
    ) ORDER BY ex.date ASC), '[]'::jsonb)
    INTO v_exceptions
    FROM public.tutor_availability_exceptions ex
    WHERE ex.tutor_id = p_tutor_id AND ex.date >= CURRENT_DATE;

    -- 4. Fetch upcoming lessons
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'bookingId', l.booking_id,
        'bookingRef', b.booking_ref,
        'studentId', l.student_id,
        'studentName', u.display_name,
        'studentEmail', u.email,
        'studentAvatar', u.avatar_url,
        'subjectName', COALESCE(b.subject_name, 'General Tutoring'),
        'scheduledStart', l.scheduled_start,
        'scheduledEnd', l.scheduled_end,
        'status', l.status,
        'videoRoomId', l.video_room_id,
        'lessonNotes', l.lesson_notes
    ) ORDER BY l.scheduled_start ASC), '[]'::jsonb)
    INTO v_upcoming
    FROM public.lessons l
    LEFT JOIN public.bookings b ON b.id = l.booking_id
    LEFT JOIN public.users u ON u.id = l.student_id
    WHERE l.tutor_id = p_tutor_id
      AND l.status IN ('SCHEDULED', 'LIVE')
      AND l.scheduled_start >= now() - INTERVAL '4 hours';

    -- 5. Build final result
    SELECT jsonb_build_object(
        'tutorId', p_tutor_id,
        'settings', jsonb_build_object(
            'bufferMinutes', v_settings.buffer_minutes,
            'minNoticeHours', v_settings.min_notice_hours,
            'maxAdvanceDays', v_settings.max_advance_days,
            'defaultLessonDuration', v_settings.default_lesson_duration
        ),
        'rules', v_rules,
        'exceptions', v_exceptions,
        'upcomingLessons', v_upcoming
    ) INTO result;

    RETURN result;
END;
$$;
