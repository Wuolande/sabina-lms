-- ====================================================================
-- MIGRATION 009: Bookings, Lessons, Availability, Materials & Reviews
-- ====================================================================

-- 1. Tutor Availability Rules Table
CREATE TABLE IF NOT EXISTS public.tutor_availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '18:00:00',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tutor_day UNIQUE (tutor_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_avail_rules_tutor ON public.tutor_availability_rules(tutor_id);

-- 2. Tutor Availability Exceptions Table
CREATE TABLE IF NOT EXISTS public.tutor_availability_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT true,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avail_exceptions_tutor ON public.tutor_availability_exceptions(tutor_id, date);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref VARCHAR(30) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_name VARCHAR(100) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes IN (25, 50, 75, 80, 90)),
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW_STUDENT', 'NO_SHOW_TUTOR', 'DISPUTED')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('UNPAID', 'PENDING', 'PAID', 'REFUNDED', 'DISPUTED')),
    payment_method VARCHAR(50) DEFAULT 'card',
    video_room_id VARCHAR(100) NOT NULL,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES public.users(id),
    cancelled_at TIMESTAMPTZ,
    meeting_link TEXT,
    student_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_student ON public.bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor ON public.bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start ON public.bookings(start_time);

-- 4. Lessons Table
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
    video_room_id VARCHAR(100) NOT NULL,
    lesson_notes TEXT,
    student_feedback TEXT,
    private_tutor_notes TEXT,
    has_student_reviewed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_student ON public.lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_tutor ON public.lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_booking ON public.lessons(booking_id);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON public.lessons(status);

-- 5. Lesson Materials Table
CREATE TABLE IF NOT EXISTS public.lesson_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    size_bytes BIGINT DEFAULT 0,
    file_type VARCHAR(100),
    url TEXT NOT NULL,
    uploaded_by_user_id UUID NOT NULL REFERENCES public.users(id),
    uploaded_by_role VARCHAR(20) NOT NULL CHECK (uploaded_by_role IN ('TUTOR', 'STUDENT', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_lesson ON public.lesson_materials(lesson_id);

-- 6. Lesson Reviews Table
CREATE TABLE IF NOT EXISTS public.lesson_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL UNIQUE REFERENCES public.lessons(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_tutor ON public.lesson_reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student ON public.lesson_reviews(student_id);

-- 7. Booking Disputes Table
CREATE TABLE IF NOT EXISTS public.booking_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    raised_by_user_id UUID NOT NULL REFERENCES public.users(id),
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED_REFUNDED', 'RESOLVED_DISMISSED')),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES public.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_booking ON public.booking_disputes(booking_id);

-- 8. Updated At Triggers
DROP TRIGGER IF EXISTS trg_avail_rules_updated_at ON public.tutor_availability_rules;
CREATE TRIGGER trg_avail_rules_updated_at BEFORE UPDATE ON public.tutor_availability_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_lessons_updated_at ON public.lessons;
CREATE TRIGGER trg_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Enable RLS
ALTER TABLE public.tutor_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS avail_rules_all ON public.tutor_availability_rules;
CREATE POLICY avail_rules_all ON public.tutor_availability_rules FOR ALL USING (true);

DROP POLICY IF EXISTS avail_exceptions_all ON public.tutor_availability_exceptions;
CREATE POLICY avail_exceptions_all ON public.tutor_availability_exceptions FOR ALL USING (true);

DROP POLICY IF EXISTS bookings_all ON public.bookings;
CREATE POLICY bookings_all ON public.bookings FOR ALL USING (true);

DROP POLICY IF EXISTS lessons_all ON public.lessons;
CREATE POLICY lessons_all ON public.lessons FOR ALL USING (true);

DROP POLICY IF EXISTS materials_all ON public.lesson_materials;
CREATE POLICY materials_all ON public.lesson_materials FOR ALL USING (true);

DROP POLICY IF EXISTS reviews_all ON public.lesson_reviews;
CREATE POLICY reviews_all ON public.lesson_reviews FOR ALL USING (true);

DROP POLICY IF EXISTS disputes_all ON public.booking_disputes;
CREATE POLICY disputes_all ON public.booking_disputes FOR ALL USING (true);

-- 10. Atomic Stored Procedure: create_booking_atomic
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

-- 11. Atomic Stored Procedure: complete_lesson_atomic
CREATE OR REPLACE FUNCTION public.complete_lesson_atomic(
    p_lesson_id UUID,
    p_actual_end TIMESTAMPTZ DEFAULT NOW(),
    p_student_feedback TEXT DEFAULT NULL,
    p_private_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lesson RECORD;
    v_duration_hours NUMERIC(6,1);
BEGIN
    SELECT * INTO v_lesson FROM public.lessons WHERE id = p_lesson_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lesson with ID % not found', p_lesson_id;
    END IF;

    -- Update lesson
    UPDATE public.lessons
    SET status = 'COMPLETED',
        actual_end = p_actual_end,
        student_feedback = COALESCE(p_student_feedback, student_feedback),
        private_tutor_notes = COALESCE(p_private_notes, private_tutor_notes),
        updated_at = NOW()
    WHERE id = p_lesson_id;

    -- Update booking
    UPDATE public.bookings
    SET status = 'COMPLETED',
        updated_at = NOW()
    WHERE id = v_lesson.booking_id;

    -- Compute duration hours
    v_duration_hours := ROUND(EXTRACT(EPOCH FROM (v_lesson.scheduled_end - v_lesson.scheduled_start)) / 3600.0, 1);

    -- Update student_profiles stats
    UPDATE public.student_profiles
    SET completed_lessons = completed_lessons + 1,
        total_hours_learned = total_hours_learned + v_duration_hours,
        last_active_at = NOW(),
        updated_at = NOW()
    WHERE user_id = v_lesson.student_id;

    -- Update tutor_profiles stats
    UPDATE public.tutor_profiles
    SET total_lessons = total_lessons + 1,
        updated_at = NOW()
    WHERE id = v_lesson.tutor_id;

    -- Update student_tutor_enrollments
    UPDATE public.student_tutor_enrollments
    SET total_lessons_together = total_lessons_together + 1,
        total_hours_together = total_hours_together + v_duration_hours,
        last_lesson_at = NOW(),
        updated_at = NOW()
    WHERE student_id = v_lesson.student_id AND tutor_id = v_lesson.tutor_id;

    RETURN jsonb_build_object(
        'success', true,
        'lessonId', p_lesson_id,
        'status', 'COMPLETED',
        'durationHours', v_duration_hours
    );
END;
$$;

-- 12. Stored Procedure: get_booking_360_aggregate
CREATE OR REPLACE FUNCTION public.get_booking_360_aggregate(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', b.id,
        'bookingRef', b.booking_ref,
        'startTime', b.start_time,
        'endTime', b.end_time,
        'durationMinutes', b.duration_minutes,
        'price', b.price,
        'currency', b.currency,
        'status', b.status,
        'paymentStatus', b.payment_status,
        'paymentMethod', b.payment_method,
        'videoRoomId', b.video_room_id,
        'meetingLink', b.meeting_link,
        'cancellationReason', b.cancellation_reason,
        'cancelledAt', b.cancelled_at,
        'studentNotes', b.student_notes,
        'createdAt', b.created_at,
        'updatedAt', b.updated_at,
        'student', jsonb_build_object(
            'id', su.id,
            'displayName', su.display_name,
            'email', su.email,
            'avatarUrl', su.avatar_url,
            'country', su.country,
            'timezone', su.timezone
        ),
        'tutor', jsonb_build_object(
            'id', tp.id,
            'slug', tp.slug,
            'headline', tp.headline,
            'hourlyRate', tp.hourly_rate,
            'currency', tp.currency,
            'displayName', tu.display_name,
            'email', tu.email,
            'avatarUrl', tu.avatar_url
        ),
        'subject', jsonb_build_object(
            'id', s.id,
            'name', COALESCE(b.subject_name, s.name, 'General')
        ),
        'lesson', (
            SELECT jsonb_build_object(
                'id', l.id,
                'status', l.status,
                'scheduledStart', l.scheduled_start,
                'scheduledEnd', l.scheduled_end,
                'actualStart', l.actual_start,
                'actualEnd', l.actual_end,
                'lessonNotes', l.lesson_notes,
                'studentFeedback', l.student_feedback,
                'privateTutorNotes', l.private_tutor_notes,
                'hasStudentReviewed', l.has_student_reviewed
            )
            FROM public.lessons l
            WHERE l.booking_id = b.id
            LIMIT 1
        ),
        'materials', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', lm.id,
                'name', lm.name,
                'sizeBytes', lm.size_bytes,
                'fileType', lm.file_type,
                'url', lm.url,
                'uploadedByRole', lm.uploaded_by_role,
                'createdAt', lm.created_at
            ))
            FROM public.lesson_materials lm
            JOIN public.lessons l ON l.id = lm.lesson_id
            WHERE l.booking_id = b.id
        ), '[]'::jsonb),
        'review', (
            SELECT jsonb_build_object(
                'id', lr.id,
                'rating', lr.rating,
                'comment', lr.comment,
                'createdAt', lr.created_at
            )
            FROM public.lesson_reviews lr
            JOIN public.lessons l ON l.id = lr.lesson_id
            WHERE l.booking_id = b.id
            LIMIT 1
        )
    )
    INTO result
    FROM public.bookings b
    JOIN public.users su ON su.id = b.student_id
    JOIN public.tutor_profiles tp ON tp.id = b.tutor_id
    JOIN public.users tu ON tu.id = tp.user_id
    LEFT JOIN public.subjects s ON s.id = b.subject_id
    WHERE b.id = p_booking_id;

    RETURN result;
END;
$$;
