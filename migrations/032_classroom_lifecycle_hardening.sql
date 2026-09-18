-- ====================================================================
-- MIGRATION 032: Classroom Lifecycle Hardening, Time Extensions & No-Show Engine
-- ====================================================================

-- 1. Update lessons_status_check to include NO_SHOW_STUDENT and NO_SHOW_TUTOR
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_status_check;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_status_check 
    CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'NO_SHOW_STUDENT', 'NO_SHOW_TUTOR'));

-- 2. Stored Procedure: mark_lesson_started_atomic
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
BEGIN
    SELECT * INTO v_lesson FROM public.lessons WHERE id = p_lesson_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lesson not found');
    END IF;

    -- Only update if not already in a finalized terminal status
    IF v_lesson.status IN ('COMPLETED', 'CANCELLED', 'NO_SHOW_STUDENT', 'NO_SHOW_TUTOR') THEN
        RETURN jsonb_build_object(
            'success', true,
            'lessonId', p_lesson_id,
            'status', v_lesson.status,
            'actualStart', v_lesson.actual_start
        );
    END IF;

    -- Stamp actual_start if null and transition to LIVE if SCHEDULED
    UPDATE public.lessons
    SET actual_start = COALESCE(actual_start, NOW()),
        status = CASE WHEN status = 'SCHEDULED' THEN 'LIVE' ELSE status END,
        updated_at = NOW()
    WHERE id = p_lesson_id
    RETURNING actual_start, status INTO v_lesson.actual_start, v_lesson.status;

    RETURN jsonb_build_object(
        'success', true,
        'lessonId', p_lesson_id,
        'status', v_lesson.status,
        'actualStart', v_lesson.actual_start
    );
END;
$$;

-- 3. Stored Procedure: extend_lesson_atomic
CREATE OR REPLACE FUNCTION public.extend_lesson_atomic(
    p_lesson_id UUID,
    p_additional_minutes INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lesson RECORD;
    v_new_end TIMESTAMPTZ;
    v_conflict_count INT;
BEGIN
    -- Validate additional minutes
    IF p_additional_minutes NOT IN (5, 10, 15, 20, 30) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid extension duration. Permitted: 5, 10, 15, 20, 30 minutes.');
    END IF;

    SELECT * INTO v_lesson FROM public.lessons WHERE id = p_lesson_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lesson not found');
    END IF;

    IF v_lesson.status NOT IN ('SCHEDULED', 'LIVE') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot extend a lesson that is already ' || v_lesson.status);
    END IF;

    v_new_end := v_lesson.scheduled_end + (p_additional_minutes || ' minutes')::INTERVAL;

    -- Check if tutor has a conflicting confirmed booking starting before v_new_end
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.bookings b
    WHERE b.tutor_id = v_lesson.tutor_id
      AND b.id != v_lesson.booking_id
      AND b.status IN ('CONFIRMED', 'PENDING')
      AND b.start_time < v_new_end
      AND b.end_time > v_lesson.scheduled_end;

    IF v_conflict_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot extend lesson: Tutor has another scheduled booking immediately following this session.'
        );
    END IF;

    -- Update lesson scheduled_end
    UPDATE public.lessons
    SET scheduled_end = v_new_end,
        updated_at = NOW()
    WHERE id = p_lesson_id;

    -- Update booking end_time and duration_minutes (if duration check permits)
    UPDATE public.bookings
    SET end_time = v_new_end,
        updated_at = NOW()
    WHERE id = v_lesson.booking_id;

    RETURN jsonb_build_object(
        'success', true,
        'lessonId', p_lesson_id,
        'additionalMinutes', p_additional_minutes,
        'newScheduledEnd', v_new_end
    );
END;
$$;

-- 4. Stored Procedure: resolve_no_show_atomic
CREATE OR REPLACE FUNCTION public.resolve_no_show_atomic(
    p_lesson_id UUID,
    p_reported_by_role VARCHAR, -- 'TUTOR' or 'STUDENT'
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

    -- Check 15-minute wait rule
    v_minutes_since_start := EXTRACT(EPOCH FROM (NOW() - v_lesson.scheduled_start)) / 60;
    IF v_minutes_since_start < 15 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Attendance policy requires waiting at least 15 minutes after scheduled start before claiming no-show. Minutes elapsed: ' || ROUND(v_minutes_since_start, 1)
        );
    END IF;

    v_duration_hours := ROUND(EXTRACT(EPOCH FROM (v_lesson.scheduled_end - v_lesson.scheduled_start)) / 3600.0, 1);

    IF p_reported_by_role = 'TUTOR' THEN
        -- STUDENT NO-SHOW: Tutor waited, student absent. Tutor receives full compensation.
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

        -- Tutor earns full lesson payout
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
        -- TUTOR NO-SHOW: Student waited, tutor absent. Student receives 100% refund/credit.
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
