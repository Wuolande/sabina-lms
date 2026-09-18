-- ====================================================================
-- MIGRATION 031: Concurrency Lock & Double-Booking Guard for Bookings
-- ====================================================================

CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_student_id UUID,
    p_tutor_id UUID,
    p_subject_id UUID,
    p_subject_name VARCHAR,
    p_start_time TIMESTAMPTZ,
    p_duration_minutes INT,
    p_price NUMERIC,
    p_currency VARCHAR,
    p_payment_method VARCHAR,
    p_student_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking_id UUID;
    v_lesson_id UUID;
    v_booking_ref VARCHAR(30);
    v_video_room_id VARCHAR(100);
    v_end_time TIMESTAMPTZ;
    v_result JSONB;
BEGIN
    v_end_time := p_start_time + (p_duration_minutes || ' minutes')::INTERVAL;

    -- 1. Anti-Past Booking Guard: prevent scheduling sessions in the past
    IF p_start_time < (NOW() - INTERVAL '5 minutes') THEN
        RAISE EXCEPTION 'BOOKING_PAST_NOT_ALLOWED: Cannot schedule a booking in the past.';
    END IF;

    -- 2. Anti-Double-Booking / Concurrency Lock
    -- Acquire exclusive row lock on tutor profile to serialize concurrent bookings
    PERFORM id FROM public.tutor_profiles WHERE id = p_tutor_id FOR UPDATE;

    IF EXISTS (
        SELECT 1 FROM public.bookings
        WHERE tutor_id = p_tutor_id
          AND status NOT IN ('CANCELLED', 'RESCHEDULED', 'DISPUTED')
          AND (start_time < v_end_time AND end_time > p_start_time)
    ) THEN
        RAISE EXCEPTION 'BOOKING_OVERLAP_DETECTED: This time slot has already been booked.';
    END IF;

    v_booking_ref := 'BK-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0') || '-' || TO_CHAR(NOW(), 'YYMM');
    v_video_room_id := 'room-sabina-' || gen_random_uuid();

    -- Insert Booking
    INSERT INTO public.bookings (
        student_id, tutor_id, subject_id, subject_name,
        start_time, end_time, duration_minutes, price, currency,
        status, payment_status, payment_method, video_room_id,
        student_notes, booking_ref
    ) VALUES (
        p_student_id, p_tutor_id, p_subject_id, p_subject_name,
        p_start_time, v_end_time, p_duration_minutes, p_price, p_currency,
        'CONFIRMED', 'PAID', p_payment_method, v_video_room_id,
        p_student_notes, v_booking_ref
    ) RETURNING id INTO v_booking_id;

    -- Insert Corresponding Lesson
    INSERT INTO public.lessons (
        booking_id, student_id, tutor_id, subject_id,
        scheduled_start, scheduled_end, status, video_room_id,
        lesson_notes
    ) VALUES (
        v_booking_id, p_student_id, p_tutor_id, p_subject_id,
        p_start_time, v_end_time, 'SCHEDULED', v_video_room_id,
        p_student_notes
    ) RETURNING id INTO v_lesson_id;

    -- Update or ensure enrollment record
    INSERT INTO public.student_tutor_enrollments (student_id, tutor_id, total_lessons_together, first_lesson_at, last_lesson_at)
    VALUES (p_student_id, p_tutor_id, 1, p_start_time, p_start_time)
    ON CONFLICT (student_id, tutor_id) DO UPDATE
    SET last_lesson_at = EXCLUDED.last_lesson_at,
        updated_at = NOW();

    SELECT jsonb_build_object(
        'bookingId', v_booking_id,
        'lessonId', v_lesson_id,
        'bookingRef', v_booking_ref,
        'videoRoomId', v_video_room_id,
        'startTime', p_start_time,
        'endTime', v_end_time,
        'price', p_price,
        'currency', p_currency
    ) INTO v_result;

    RETURN v_result;
END;
$$;
