-- ====================================================================
-- MIGRATION 033: Classroom Early Join Guard, Attendance Integrity & Reconnection Tracking
-- ====================================================================

-- 1. Add attendance tracking columns to public.lessons
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS tutor_joined_at TIMESTAMPTZ;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS student_joined_at TIMESTAMPTZ;

-- 2. Enhanced mark_lesson_started_atomic with Early Arrival Guard
CREATE OR REPLACE FUNCTION public.mark_lesson_started_atomic(
    p_lesson_id UUID,
    p_participant_role VARCHAR DEFAULT 'STUDENT'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lesson RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_is_early BOOLEAN;
BEGIN
    SELECT * INTO v_lesson FROM public.lessons WHERE id = p_lesson_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lesson not found');
    END IF;

    -- Update individual arrival timestamps
    IF p_participant_role = 'TUTOR' THEN
        UPDATE public.lessons
        SET tutor_joined_at = COALESCE(tutor_joined_at, v_now),
            updated_at = v_now
        WHERE id = p_lesson_id;
    ELSIF p_participant_role = 'STUDENT' THEN
        UPDATE public.lessons
        SET student_joined_at = COALESCE(student_joined_at, v_now),
            updated_at = v_now
        WHERE id = p_lesson_id;
    END IF;

    -- If already in a terminal status, return existing
    IF v_lesson.status IN ('COMPLETED', 'CANCELLED', 'NO_SHOW_STUDENT', 'NO_SHOW_TUTOR') THEN
        RETURN jsonb_build_object(
            'success', true,
            'lessonId', p_lesson_id,
            'status', v_lesson.status,
            'phase', 'COMPLETED',
            'actualStart', v_lesson.actual_start
        );
    END IF;

    -- Check if joining before scheduled start
    v_is_early := v_now < v_lesson.scheduled_start;

    IF v_is_early THEN
        -- EARLY JOIN: Classroom is in PREVIEW mode.
        -- Status remains SCHEDULED and actual_start is NOT stamped.
        RETURN jsonb_build_object(
            'success', true,
            'lessonId', p_lesson_id,
            'status', v_lesson.status,
            'phase', 'PRE_CLASS_PREVIEW',
            'actualStart', v_lesson.actual_start,
            'startsInSeconds', ROUND(EXTRACT(EPOCH FROM (v_lesson.scheduled_start - v_now)))
        );
    ELSE
        -- LIVE TEACHING: Scheduled start has arrived or passed.
        UPDATE public.lessons
        SET actual_start = COALESCE(actual_start, v_now),
            status = CASE WHEN status = 'SCHEDULED' THEN 'LIVE' ELSE status END,
            updated_at = v_now
        WHERE id = p_lesson_id
        RETURNING actual_start, status INTO v_lesson.actual_start, v_lesson.status;

        RETURN jsonb_build_object(
            'success', true,
            'lessonId', p_lesson_id,
            'status', v_lesson.status,
            'phase', 'LIVE_SESSION',
            'actualStart', v_lesson.actual_start
        );
    END IF;
END;
$$;

-- 3. Enhanced resolve_no_show_atomic with Attendance Fraud Prevention
CREATE OR REPLACE FUNCTION public.resolve_no_show_atomic(
    p_lesson_id UUID,
    p_reported_by_role VARCHAR,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lesson RECORD;
    v_minutes_since_start INT;
    v_duration_hours NUMERIC(6,1);
BEGIN
    SELECT * INTO v_lesson FROM public.lessons WHERE id = p_lesson_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lesson not found');
    END IF;

    IF v_lesson.status IN ('COMPLETED', 'CANCELLED', 'NO_SHOW_STUDENT', 'NO_SHOW_TUTOR') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lesson is already resolved with status: ' || v_lesson.status);
    END IF;

    -- Enforce 15-minute wait rule
    v_minutes_since_start := EXTRACT(EPOCH FROM (NOW() - v_lesson.scheduled_start)) / 60;
    IF v_minutes_since_start < 15 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Attendance policy requires waiting at least 15 minutes after scheduled start before claiming no-show. Minutes elapsed: ' || ROUND(v_minutes_since_start, 1)
        );
    END IF;

    v_duration_hours := ROUND(EXTRACT(EPOCH FROM (v_lesson.scheduled_end - v_lesson.scheduled_start)) / 3600.0, 1);

    IF p_reported_by_role = 'TUTOR' THEN
        -- FRAUD CHECK: If student attended at any point, cannot be marked No-Show!
        IF v_lesson.student_joined_at IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Cannot claim Student No-Show: Student joined the session at ' || v_lesson.student_joined_at || '. If the session was interrupted by network issues, please conclude using End Class instead.'
            );
        END IF;

        -- Tutor must have joined to claim no-show
        IF v_lesson.tutor_joined_at IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Cannot claim Student No-Show: Tutor was not recorded as present in the classroom.'
            );
        END IF;

        UPDATE public.lessons
        SET status = 'NO_SHOW_STUDENT',
            actual_end = NOW(),
            private_tutor_notes = COALESCE(p_reason, 'Student did not attend the scheduled session (waited 15+ minutes).'),
            updated_at = NOW()
        WHERE id = p_lesson_id;

        UPDATE public.bookings
        SET status = 'NO_SHOW_STUDENT',
            cancellation_reason = COALESCE(p_reason, 'Student No-Show verified after 15-minute waiting period.'),
            updated_at = NOW()
        WHERE id = v_lesson.booking_id;

        -- Tutor receives full lesson payout
        UPDATE public.tutor_profiles
        SET total_lessons = total_lessons + 1,
            updated_at = NOW()
        WHERE id = v_lesson.tutor_id;

        RETURN jsonb_build_object(
            'success', true,
            'resolution', 'NO_SHOW_STUDENT',
            'lessonId', p_lesson_id,
            'payoutStatus', 'TUTOR_COMPENSATED_100',
            'hoursCredited', v_duration_hours
        );

    ELSIF p_reported_by_role = 'STUDENT' THEN
        -- FRAUD CHECK: If tutor attended, student cannot claim tutor no-show
        IF v_lesson.tutor_joined_at IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Cannot report Tutor No-Show: Tutor was recorded present in the classroom at ' || v_lesson.tutor_joined_at || '.'
            );
        END IF;

        -- Student must have joined to report tutor absence
        IF v_lesson.student_joined_at IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Cannot report Tutor No-Show: Student was not recorded as present in the classroom.'
            );
        END IF;

        UPDATE public.lessons
        SET status = 'NO_SHOW_TUTOR',
            actual_end = NOW(),
            student_feedback = COALESCE(p_reason, 'Tutor did not attend the scheduled session (waited 15+ minutes).'),
            updated_at = NOW()
        WHERE id = p_lesson_id;

        UPDATE public.bookings
        SET status = 'NO_SHOW_TUTOR',
            payment_status = 'REFUNDED',
            cancellation_reason = COALESCE(p_reason, 'Tutor No-Show verified after 15-minute waiting period.'),
            updated_at = NOW()
        WHERE id = v_lesson.booking_id;

        RETURN jsonb_build_object(
            'success', true,
            'resolution', 'NO_SHOW_TUTOR',
            'lessonId', p_lesson_id,
            'refundStatus', 'STUDENT_REFUNDED_100',
            'strikeIssuedToTutor', true
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid reporter role: ' || p_reported_by_role);
    END IF;
END;
$$;
