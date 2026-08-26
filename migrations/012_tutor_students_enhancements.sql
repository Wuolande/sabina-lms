-- ====================================================================
-- MIGRATION 012: Student Tutor Enrollments & Student 360 Stored Procedure
-- ====================================================================

-- 1. Add status and roadmap columns to student_tutor_enrollments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_tutor_enrollments' AND column_name = 'status') THEN
        ALTER TABLE public.student_tutor_enrollments ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_tutor_enrollments' AND column_name = 'tutor_roadmap') THEN
        ALTER TABLE public.student_tutor_enrollments ADD COLUMN tutor_roadmap TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_tutor_enrollments' AND column_name = 'target_level') THEN
        ALTER TABLE public.student_tutor_enrollments ADD COLUMN target_level TEXT;
    END IF;
END $$;

-- 2. Stored Procedure: get_tutor_student_360
CREATE OR REPLACE FUNCTION public.get_tutor_student_360(p_tutor_id UUID, p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_profile RECORD;
    v_enrollment RECORD;
    v_goals JSONB;
    v_lessons JSONB;
    v_materials JSONB;
    result JSONB;
BEGIN
    -- Fetch student user info
    SELECT id, email, display_name, avatar_url, country, timezone, phone, created_at
    INTO v_user
    FROM public.users
    WHERE id = p_student_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Fetch student learning profile
    SELECT target_exam, current_level, weekly_study_hours_target, total_hours_learned, completed_lessons, learning_streak_days
    INTO v_profile
    FROM public.student_profiles
    WHERE user_id = p_student_id;

    -- Fetch enrollment record with this tutor
    SELECT status, total_lessons_together, total_hours_together, private_tutor_notes, tutor_roadmap, target_level, first_lesson_at, last_lesson_at
    INTO v_enrollment
    FROM public.student_tutor_enrollments
    WHERE tutor_id = p_tutor_id AND student_id = p_student_id;

    -- Fetch learning goals
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', slg.id,
        'subjectName', slg.subject_name,
        'targetGoal', COALESCE(slg.title, slg.description),
        'targetDate', slg.target_date,
        'progressPct', slg.progress_percent,
        'status', slg.status,
        'createdAt', slg.created_at
    ) ORDER BY slg.created_at DESC), '[]'::jsonb)
    INTO v_goals
    FROM public.student_learning_goals slg
    WHERE slg.student_id = p_student_id;

    -- Fetch all lessons between this student and tutor
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'bookingId', l.booking_id,
        'bookingRef', b.booking_ref,
        'subjectName', COALESCE(b.subject_name, 'General Tutoring'),
        'scheduledStart', l.scheduled_start,
        'scheduledEnd', l.scheduled_end,
        'actualStart', l.actual_start,
        'actualEnd', l.actual_end,
        'status', l.status,
        'curriculumTopic', l.curriculum_topic,
        'lessonNotes', l.lesson_notes,
        'studentFeedback', l.student_feedback,
        'hasStudentReviewed', l.has_student_reviewed,
        'videoRoomId', l.video_room_id
    ) ORDER BY l.scheduled_start DESC), '[]'::jsonb)
    INTO v_lessons
    FROM public.lessons l
    LEFT JOIN public.bookings b ON b.id = l.booking_id
    WHERE l.student_id = p_student_id
      AND l.tutor_id = p_tutor_id;

    -- Fetch shared materials between this student and tutor
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', lm.id,
        'lessonId', lm.lesson_id,
        'name', lm.name,
        'sizeBytes', lm.size_bytes,
        'fileType', lm.file_type,
        'url', lm.url,
        'uploadedByRole', lm.uploaded_by_role,
        'createdAt', lm.created_at
    ) ORDER BY lm.created_at DESC), '[]'::jsonb)
    INTO v_materials
    FROM public.lesson_materials lm
    JOIN public.lessons l ON l.id = lm.lesson_id
    WHERE l.student_id = p_student_id
      AND l.tutor_id = p_tutor_id;

    -- Build 360 aggregate
    SELECT jsonb_build_object(
        'studentId', v_user.id,
        'email', v_user.email,
        'displayName', v_user.display_name,
        'avatarUrl', v_user.avatar_url,
        'country', v_user.country,
        'timezone', v_user.timezone,
        'phoneNumber', v_user.phone,
        'joinedAt', v_user.created_at,
        'targetExam', v_profile.target_exam,
        'currentLevel', v_profile.current_level,
        'totalHoursLearned', v_profile.total_hours_learned,
        'learningStreakDays', v_profile.learning_streak_days,
        'enrollment', jsonb_build_object(
            'status', COALESCE(v_enrollment.status, 'ACTIVE'),
            'totalLessonsTogether', COALESCE(v_enrollment.total_lessons_together, 0),
            'totalHoursTogether', COALESCE(v_enrollment.total_hours_together, 0),
            'privateTutorNotes', v_enrollment.private_tutor_notes,
            'tutorRoadmap', v_enrollment.tutor_roadmap,
            'targetLevel', v_enrollment.target_level,
            'firstEnrolledAt', v_enrollment.first_lesson_at,
            'lastLessonAt', v_enrollment.last_lesson_at
        ),
        'learningGoals', v_goals,
        'lessons', v_lessons,
        'materials', v_materials
    )
    INTO result;

    RETURN result;
END;
$$;
