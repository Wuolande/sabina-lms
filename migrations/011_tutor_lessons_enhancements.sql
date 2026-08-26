-- ====================================================================
-- MIGRATION 011: Tutor Lessons Enhancements, Homework & 360 Workspace
-- ====================================================================

-- 1. Add curriculum and homework columns to lessons table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'curriculum_topic') THEN
        ALTER TABLE public.lessons ADD COLUMN curriculum_topic TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'homework_assigned') THEN
        ALTER TABLE public.lessons ADD COLUMN homework_assigned TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'homework_due_date') THEN
        ALTER TABLE public.lessons ADD COLUMN homework_due_date DATE;
    END IF;
END $$;

-- 2. Add tutor reply columns to lesson_reviews table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_reviews' AND column_name = 'tutor_reply') THEN
        ALTER TABLE public.lesson_reviews ADD COLUMN tutor_reply TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_reviews' AND column_name = 'tutor_replied_at') THEN
        ALTER TABLE public.lesson_reviews ADD COLUMN tutor_replied_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Stored Procedure: get_tutor_lesson_360
CREATE OR REPLACE FUNCTION public.get_tutor_lesson_360(p_lesson_id UUID, p_tutor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lesson RECORD;
    v_booking RECORD;
    v_student RECORD;
    v_materials JSONB;
    v_review JSONB;
    v_goals JSONB;
    v_past_lessons JSONB;
    result JSONB;
BEGIN
    -- Fetch lesson
    SELECT * INTO v_lesson
    FROM public.lessons
    WHERE id = p_lesson_id AND tutor_id = p_tutor_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Fetch booking
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = v_lesson.booking_id;

    -- Fetch student user info
    SELECT id, email, display_name, avatar_url, country, timezone, created_at
    INTO v_student
    FROM public.users
    WHERE id = v_lesson.student_id;

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

    -- Fetch student learning goals
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', slg.id,
        'subjectName', slg.subject_name,
        'targetGoal', COALESCE(slg.title, slg.description),
        'targetDate', slg.target_date,
        'progressPct', slg.progress_percent,
        'status', slg.status
    ) ORDER BY slg.created_at DESC), '[]'::jsonb)
    INTO v_goals
    FROM public.student_learning_goals slg
    WHERE slg.student_id = v_lesson.student_id;

    -- Fetch past lessons between this student and tutor
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', pl.id,
        'scheduledStart', pl.scheduled_start,
        'scheduledEnd', pl.scheduled_end,
        'status', pl.status,
        'curriculumTopic', pl.curriculum_topic,
        'lessonNotes', pl.lesson_notes
    ) ORDER BY pl.scheduled_start DESC), '[]'::jsonb)
    INTO v_past_lessons
    FROM public.lessons pl
    WHERE pl.student_id = v_lesson.student_id
      AND pl.tutor_id = p_tutor_id
      AND pl.id != p_lesson_id;

    -- Build final 360 aggregate
    SELECT jsonb_build_object(
        'id', v_lesson.id,
        'bookingId', v_lesson.booking_id,
        'bookingRef', COALESCE(v_booking.booking_ref, 'BK-LIVE'),
        'scheduledStart', v_lesson.scheduled_start,
        'scheduledEnd', v_lesson.scheduled_end,
        'actualStart', v_lesson.actual_start,
        'actualEnd', v_lesson.actual_end,
        'status', v_lesson.status,
        'videoRoomId', v_lesson.video_room_id,
        'price', COALESCE(v_booking.price, 0),
        'currency', COALESCE(v_booking.currency, 'USD'),
        'subjectName', COALESCE(v_booking.subject_name, 'General Tutoring'),
        'curriculumTopic', v_lesson.curriculum_topic,
        'homeworkAssigned', v_lesson.homework_assigned,
        'homeworkDueDate', v_lesson.homework_due_date,
        'lessonNotes', v_lesson.lesson_notes,
        'studentFeedback', v_lesson.student_feedback,
        'privateTutorNotes', v_lesson.private_tutor_notes,
        'hasStudentReviewed', v_lesson.has_student_reviewed,
        'createdAt', v_lesson.created_at,
        'student', jsonb_build_object(
            'id', v_student.id,
            'email', v_student.email,
            'displayName', v_student.display_name,
            'avatarUrl', v_student.avatar_url,
            'country', v_student.country,
            'timezone', v_student.timezone,
            'joinedAt', v_student.created_at
        ),
        'materials', v_materials,
        'review', v_review,
        'learningGoals', v_goals,
        'pastLessons', v_past_lessons
    )
    INTO result;

    RETURN result;
END;
$$;
