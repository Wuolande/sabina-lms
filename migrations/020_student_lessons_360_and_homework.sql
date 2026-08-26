-- ====================================================================
-- MIGRATION 020: Student Lessons 360 & Homework Synchronization
-- ====================================================================

-- 1. Add student homework submission column to lessons
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS student_homework_notes TEXT,
ADD COLUMN IF NOT EXISTS student_homework_submitted_at TIMESTAMPTZ;

-- 2. Stored Procedure: get_student_lessons_list
CREATE OR REPLACE FUNCTION public.get_student_lessons_list(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'bookingId', l.booking_id,
        'bookingRef', COALESCE(b.booking_ref, 'BK-' || substr(l.id::text, 1, 6)),
        'tutorId', l.tutor_id,
        'tutorProfileId', tp.id,
        'tutorSlug', tp.slug,
        'tutorName', COALESCE(tu.display_name, 'Instructor'),
        'tutorAvatar', tu.avatar_url,
        'tutorHeadline', tp.headline,
        'subjectId', l.subject_id,
        'subjectName', COALESCE(b.subject_name, 'General Tutoring'),
        'scheduledStart', l.scheduled_start,
        'scheduledEnd', l.scheduled_end,
        'durationMinutes', COALESCE(b.duration_minutes, 50),
        'status', l.status,
        'curriculumTopic', l.curriculum_topic,
        'homeworkAssigned', l.homework_assigned,
        'homeworkDueDate', l.homework_due_date,
        'studentHomeworkNotes', l.student_homework_notes,
        'studentHomeworkSubmittedAt', l.student_homework_submitted_at,
        'videoRoomId', l.video_room_id,
        'materialsCount', (SELECT COUNT(*) FROM public.lesson_materials lm WHERE lm.lesson_id = l.id),
        'reviewRating', lr.rating,
        'hasReview', (lr.id IS NOT NULL),
        'tutorHasReplied', (lr.tutor_reply IS NOT NULL)
    ) ORDER BY l.scheduled_start DESC), '[]'::jsonb)
    INTO result
    FROM public.lessons l
    LEFT JOIN public.bookings b ON b.id = l.booking_id
    LEFT JOIN public.tutor_profiles tp ON tp.id = l.tutor_id
    LEFT JOIN public.users tu ON tu.id = tp.user_id
    LEFT JOIN public.lesson_reviews lr ON lr.lesson_id = l.id
    WHERE l.student_id = p_student_id;

    RETURN result;
END;
$$;

-- 3. Stored Procedure: get_student_lesson_360
CREATE OR REPLACE FUNCTION public.get_student_lesson_360(p_lesson_id UUID, p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lesson RECORD;
    v_booking RECORD;
    v_tutor_prof RECORD;
    v_tutor_user RECORD;
    v_materials JSONB;
    v_review JSONB;
    v_goals JSONB;
    result JSONB;
BEGIN
    -- Fetch lesson
    SELECT * INTO v_lesson
    FROM public.lessons
    WHERE id = p_lesson_id AND student_id = p_student_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Fetch booking
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = v_lesson.booking_id;

    -- Fetch tutor profile & user
    SELECT * INTO v_tutor_prof
    FROM public.tutor_profiles
    WHERE id = v_lesson.tutor_id;

    SELECT id, email, display_name, avatar_url, country, timezone
    INTO v_tutor_user
    FROM public.users
    WHERE id = v_tutor_prof.user_id;

    -- Fetch materials
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', lm.id,
        'name', lm.name,
        'sizeBytes', lm.size_bytes,
        'fileType', lm.file_type,
        'url', lm.url,
        'uploadedByRole', lm.uploaded_by_role,
        'createdAt', lm.created_at
    ) ORDER BY lm.created_at DESC), '[]'::jsonb)
    INTO v_materials
    FROM public.lesson_materials lm
    WHERE lm.lesson_id = p_lesson_id;

    -- Fetch review with tutor reply
    SELECT jsonb_build_object(
        'id', lr.id,
        'rating', lr.rating,
        'comment', lr.comment,
        'tutorReply', lr.tutor_reply,
        'tutorRepliedAt', lr.tutor_replied_at,
        'createdAt', lr.created_at
    )
    INTO v_review
    FROM public.lesson_reviews lr
    WHERE lr.lesson_id = p_lesson_id
    LIMIT 1;

    -- Fetch active student learning goals for this subject
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', slg.id,
        'subjectName', slg.subject_name,
        'title', COALESCE(slg.title, slg.description),
        'targetDate', slg.target_date,
        'progressPercent', slg.progress_percent,
        'status', slg.status
    ) ORDER BY slg.created_at DESC), '[]'::jsonb)
    INTO v_goals
    FROM public.student_learning_goals slg
    WHERE slg.student_id = p_student_id;

    -- Construct 360 payload
    SELECT jsonb_build_object(
        'id', v_lesson.id,
        'bookingId', v_lesson.booking_id,
        'bookingRef', COALESCE(v_booking.booking_ref, 'BK-' || substr(v_lesson.id::text, 1, 6)),
        'scheduledStart', v_lesson.scheduled_start,
        'scheduledEnd', v_lesson.scheduled_end,
        'durationMinutes', COALESCE(v_booking.duration_minutes, 50),
        'price', COALESCE(v_booking.price, 45),
        'currency', COALESCE(v_booking.currency, 'USD'),
        'status', v_lesson.status,
        'videoRoomId', v_lesson.video_room_id,
        'lessonNotes', v_lesson.lesson_notes,
        'studentFeedback', v_lesson.student_feedback,
        'curriculumTopic', v_lesson.curriculum_topic,
        'homeworkAssigned', v_lesson.homework_assigned,
        'homeworkDueDate', v_lesson.homework_due_date,
        'studentHomeworkNotes', v_lesson.student_homework_notes,
        'studentHomeworkSubmittedAt', v_lesson.student_homework_submitted_at,
        'subject', jsonb_build_object(
            'id', v_lesson.subject_id,
            'name', COALESCE(v_booking.subject_name, 'General Tutoring')
        ),
        'tutor', jsonb_build_object(
            'id', v_tutor_prof.id,
            'userId', v_tutor_prof.user_id,
            'slug', v_tutor_prof.slug,
            'displayName', COALESCE(v_tutor_user.display_name, 'Instructor'),
            'avatarUrl', v_tutor_user.avatar_url,
            'headline', v_tutor_prof.headline,
            'averageRating', COALESCE(v_tutor_prof.average_rating, 5.0),
            'reviewCount', COALESCE(v_tutor_prof.review_count, 0),
            'hourlyRate', COALESCE(v_tutor_prof.hourly_rate, 45),
            'country', v_tutor_user.country,
            'timezone', v_tutor_user.timezone
        ),
        'materials', v_materials,
        'review', v_review,
        'goals', v_goals
    ) INTO result;

    RETURN result;
END;
$$;

-- 4. Stored Procedure: submit_student_homework_notes
CREATE OR REPLACE FUNCTION public.submit_student_homework_notes(
    p_lesson_id UUID,
    p_student_id UUID,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.lessons
    SET 
        student_homework_notes = p_notes,
        student_homework_submitted_at = now(),
        updated_at = now()
    WHERE id = p_lesson_id AND student_id = p_student_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lesson not found or access denied';
    END IF;

    RETURN public.get_student_lesson_360(p_lesson_id, p_student_id);
END;
$$;
