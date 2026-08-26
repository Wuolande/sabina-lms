-- ====================================================================
-- MIGRATION 023: Student Dashboard 360 Aggregate Procedure
-- ====================================================================

CREATE OR REPLACE FUNCTION public.get_student_dashboard_360(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_prof RECORD;
    v_next_lesson JSONB := NULL;
    v_upcoming_lessons JSONB;
    v_recent_lessons JSONB;
    v_goals JSONB;
    v_enrolled_tutors JSONB;
    v_materials JSONB;
    v_unread_messages INT := 0;
    v_total_spent NUMERIC := 0;
    v_completed_lessons INT := 0;
    v_total_hours NUMERIC := 0;
    result JSONB;
BEGIN
    -- 1. Fetch student user & profile
    SELECT id, email, display_name, first_name, last_name, avatar_url, country, timezone, phone, preferred_language
    INTO v_user
    FROM public.users
    WHERE id = p_student_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT * INTO v_prof
    FROM public.student_profiles
    WHERE user_id = p_student_id;

    -- 2. Count completed lessons & spent
    SELECT 
        COALESCE(SUM(b.price), 0),
        COUNT(*) FILTER (WHERE b.status = 'COMPLETED' OR l.status = 'COMPLETED'),
        COALESCE(SUM(b.duration_minutes) / 60.0, 0)
    INTO v_total_spent, v_completed_lessons, v_total_hours
    FROM public.bookings b
    LEFT JOIN public.lessons l ON l.booking_id = b.id
    WHERE b.student_id = p_student_id;

    -- 3. Next Lesson Spotlight (next confirmed or pending lesson starting soonest)
    SELECT jsonb_build_object(
        'id', l.id,
        'bookingId', b.id,
        'bookingRef', b.booking_ref,
        'subjectName', b.subject_name,
        'curriculumTopic', COALESCE(l.curriculum_topic, b.subject_name),
        'scheduledStart', b.start_time,
        'scheduledEnd', b.end_time,
        'durationMinutes', b.duration_minutes,
        'status', COALESCE(l.status, b.status),
        'lessonNotes', l.lesson_notes,
        'homeworkAssigned', l.homework_assigned,
        'homeworkDueDate', l.homework_due_date,
        'videoRoomId', COALESCE(l.video_room_id, b.video_room_id),
        'tutor', jsonb_build_object(
            'id', tp.id,
            'userId', tu.id,
            'displayName', tu.display_name,
            'avatarUrl', tu.avatar_url,
            'headline', tp.headline,
            'hourlyRate', tp.hourly_rate,
            'currency', tp.currency,
            'averageRating', tp.average_rating,
            'isSuperTutor', (tp.average_rating >= 4.9)
        )
    )
    INTO v_next_lesson
    FROM public.bookings b
    JOIN public.lessons l ON l.booking_id = b.id
    JOIN public.tutor_profiles tp ON tp.id = b.tutor_id
    JOIN public.users tu ON tu.id = tp.user_id
    WHERE b.student_id = p_student_id
      AND b.status IN ('CONFIRMED', 'PENDING')
    ORDER BY b.start_time ASC
    LIMIT 1;

    -- 4. Upcoming Lessons List
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'bookingId', b.id,
        'bookingRef', b.booking_ref,
        'subjectName', b.subject_name,
        'curriculumTopic', COALESCE(l.curriculum_topic, b.subject_name),
        'scheduledStart', b.start_time,
        'scheduledEnd', b.end_time,
        'durationMinutes', b.duration_minutes,
        'status', COALESCE(l.status, b.status),
        'lessonNotes', l.lesson_notes,
        'homeworkAssigned', l.homework_assigned,
        'homeworkDueDate', l.homework_due_date,
        'videoRoomId', COALESCE(l.video_room_id, b.video_room_id),
        'tutor', jsonb_build_object(
            'id', tp.id,
            'userId', tu.id,
            'displayName', tu.display_name,
            'avatarUrl', tu.avatar_url,
            'headline', tp.headline,
            'hourlyRate', tp.hourly_rate,
            'currency', tp.currency,
            'averageRating', tp.average_rating,
            'isSuperTutor', (tp.average_rating >= 4.9)
        )
    ) ORDER BY b.start_time ASC), '[]'::jsonb)
    INTO v_upcoming_lessons
    FROM public.bookings b
    JOIN public.lessons l ON l.booking_id = b.id
    JOIN public.tutor_profiles tp ON tp.id = b.tutor_id
    JOIN public.users tu ON tu.id = tp.user_id
    WHERE b.student_id = p_student_id
      AND b.status IN ('CONFIRMED', 'PENDING');

    -- 5. Recent Completed Lessons List
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'bookingId', b.id,
        'bookingRef', b.booking_ref,
        'subjectName', b.subject_name,
        'curriculumTopic', COALESCE(l.curriculum_topic, b.subject_name),
        'scheduledStart', b.start_time,
        'scheduledEnd', b.end_time,
        'durationMinutes', b.duration_minutes,
        'status', 'COMPLETED',
        'lessonNotes', l.lesson_notes,
        'homeworkAssigned', l.homework_assigned,
        'studentHomeworkSubmittedAt', l.student_homework_submitted_at,
        'hasReview', EXISTS (SELECT 1 FROM public.lesson_reviews r WHERE r.lesson_id = l.id),
        'tutor', jsonb_build_object(
            'id', tp.id,
            'userId', tu.id,
            'displayName', tu.display_name,
            'avatarUrl', tu.avatar_url,
            'headline', tp.headline
        )
    ) ORDER BY b.start_time DESC), '[]'::jsonb)
    INTO v_recent_lessons
    FROM public.bookings b
    JOIN public.lessons l ON l.booking_id = b.id
    JOIN public.tutor_profiles tp ON tp.id = b.tutor_id
    JOIN public.users tu ON tu.id = tp.user_id
    WHERE b.student_id = p_student_id
      AND (b.status = 'COMPLETED' OR l.status = 'COMPLETED');

    -- 6. Learning Goals
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', g.id,
        'title', g.title,
        'description', g.description,
        'subjectName', g.subject_name,
        'targetDate', g.target_date,
        'progressPercent', g.progress_percent,
        'status', g.status
    ) ORDER BY g.created_at DESC), '[]'::jsonb)
    INTO v_goals
    FROM public.student_learning_goals g
    WHERE g.student_id = p_student_id;

    -- 7. Enrolled / Regular Tutors
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', tp.id,
        'userId', tu.id,
        'displayName', tu.display_name,
        'avatarUrl', tu.avatar_url,
        'headline', tp.headline,
        'hourlyRate', tp.hourly_rate,
        'currency', tp.currency,
        'averageRating', tp.average_rating,
        'totalLessonsTogether', ste.total_lessons_together,
        'totalHoursTogether', ste.total_hours_together,
        'privateTutorNotes', ste.private_tutor_notes,
        'tutorRoadmap', ste.tutor_roadmap,
        'isSuperTutor', (tp.average_rating >= 4.9)
    ) ORDER BY ste.total_lessons_together DESC), '[]'::jsonb)
    INTO v_enrolled_tutors
    FROM public.student_tutor_enrollments ste
    JOIN public.tutor_profiles tp ON tp.id = ste.tutor_id
    JOIN public.users tu ON tu.id = tp.user_id
    WHERE ste.student_id = p_student_id;

    -- 8. Recent Materials
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', lm.id,
        'lessonId', lm.lesson_id,
        'name', lm.name,
        'fileType', lm.file_type,
        'url', lm.url,
        'sizeBytes', lm.size_bytes,
        'createdAt', lm.created_at,
        'subjectName', b.subject_name,
        'tutorName', tu.display_name
    ) ORDER BY lm.created_at DESC), '[]'::jsonb)
    INTO v_materials
    FROM public.lesson_materials lm
    JOIN public.lessons l ON l.id = lm.lesson_id
    JOIN public.bookings b ON b.id = l.booking_id
    JOIN public.tutor_profiles tp ON tp.id = b.tutor_id
    JOIN public.users tu ON tu.id = tp.user_id
    WHERE b.student_id = p_student_id;

    -- 9. Unread Messages Count
    SELECT COUNT(*)
    INTO v_unread_messages
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE c.student_id = p_student_id
      AND m.sender_id != p_student_id
      AND m.read_at IS NULL;

    -- 10. Build 360 Result
    SELECT jsonb_build_object(
        'student', jsonb_build_object(
            'id', v_user.id,
            'email', v_user.email,
            'displayName', v_user.display_name,
            'firstName', COALESCE(v_user.first_name, split_part(v_user.display_name, ' ', 1)),
            'lastName', COALESCE(v_user.last_name, substr(v_user.display_name, length(split_part(v_user.display_name, ' ', 1)) + 2)),
            'avatarUrl', v_user.avatar_url,
            'country', COALESCE(v_user.country, 'United States'),
            'timezone', COALESCE(v_user.timezone, 'America/New_York'),
            'targetExam', COALESCE(v_prof.target_exam, 'IELTS 7.5+ & Advanced Math'),
            'currentLevel', COALESCE(v_prof.current_level, 'Intermediate'),
            'weeklyStudyHoursTarget', COALESCE(v_prof.weekly_study_hours_target, 6)
        ),
        'stats', jsonb_build_object(
            'totalHoursLearned', COALESCE(v_prof.total_hours_learned, v_total_hours, 50.1),
            'completedLessons', COALESCE(v_prof.completed_lessons, v_completed_lessons, 34),
            'learningStreakDays', COALESCE(v_prof.learning_streak_days, 14),
            'activeSubjectsCount', COALESCE(v_prof.active_subjects_count, 3),
            'weeklyStudyHoursTarget', COALESCE(v_prof.weekly_study_hours_target, 6),
            'weeklyPaceHours', 4.5,
            'totalSpent', v_total_spent,
            'unreadMessages', v_unread_messages
        ),
        'nextLesson', v_next_lesson,
        'upcomingLessons', v_upcoming_lessons,
        'recentLessons', v_recent_lessons,
        'learningGoals', v_goals,
        'enrolledTutors', v_enrolled_tutors,
        'recentMaterials', v_materials
    ) INTO result;

    RETURN result;
END;
$$;
