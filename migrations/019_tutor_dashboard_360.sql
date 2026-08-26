-- ====================================================================
-- MIGRATION 019: Tutor Dashboard 360 Executive Procedure
-- ====================================================================

CREATE OR REPLACE FUNCTION public.get_tutor_dashboard_360(p_tutor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prof RECORD;
    v_user RECORD;
    v_upcoming_lessons JSONB;
    v_recent_reviews JSONB;
    v_stats JSONB;
    v_total_earnings NUMERIC := 0;
    v_month_lessons INT := 0;
    v_active_students_count INT := 0;
    result JSONB;
BEGIN
    SELECT * INTO v_prof FROM public.tutor_profiles WHERE id = p_tutor_id;

    IF v_prof IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT id, email, display_name, avatar_url, country, timezone, created_at
    INTO v_user
    FROM public.users
    WHERE id = v_prof.user_id;

    -- 1. Fetch upcoming confirmed lessons
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'bookingId', l.booking_id,
        'bookingRef', COALESCE(b.booking_ref, 'BK-' || substr(l.id::text, 1, 6)),
        'studentId', l.student_id,
        'studentName', COALESCE(u.display_name, 'Student'),
        'studentAvatar', u.avatar_url,
        'subjectName', COALESCE(b.subject_name, 'English Tutoring'),
        'scheduledStart', l.scheduled_start,
        'scheduledEnd', l.scheduled_end,
        'durationMinutes', COALESCE(b.duration_minutes, 50),
        'status', l.status,
        'lessonNotes', l.lesson_notes,
        'curriculumTopic', l.curriculum_topic,
        'videoRoomId', l.video_room_id
    ) ORDER BY l.scheduled_start ASC), '[]'::jsonb)
    INTO v_upcoming_lessons
    FROM public.lessons l
    JOIN public.users u ON u.id = l.student_id
    LEFT JOIN public.bookings b ON b.id = l.booking_id
    WHERE l.tutor_id = p_tutor_id
      AND l.status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS');

    -- 2. Fetch recent reviews with tutor replies
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', r.id,
        'rating', r.rating,
        'comment', r.comment,
        'tutorReply', r.tutor_reply,
        'tutorRepliedAt', r.tutor_replied_at,
        'createdAt', r.created_at,
        'studentName', COALESCE(u.display_name, 'Verified Student'),
        'studentAvatar', u.avatar_url,
        'subjectName', COALESCE(b.subject_name, 'General Tutoring')
    ) ORDER BY r.created_at DESC), '[]'::jsonb)
    INTO v_recent_reviews
    FROM public.lesson_reviews r
    LEFT JOIN public.users u ON u.id = r.student_id
    LEFT JOIN public.lessons l ON l.id = r.lesson_id
    LEFT JOIN public.bookings b ON b.id = l.booking_id
    WHERE r.tutor_id = p_tutor_id
    LIMIT 4;

    -- 3. Calculate statistics
    SELECT COUNT(DISTINCT l.student_id) INTO v_active_students_count
    FROM public.lessons l
    WHERE l.tutor_id = p_tutor_id;

    SELECT COUNT(*) INTO v_month_lessons
    FROM public.lessons l
    WHERE l.tutor_id = p_tutor_id
      AND l.status = 'COMPLETED';

    v_total_earnings := COALESCE(v_prof.total_lessons, v_month_lessons, 1) * COALESCE(v_prof.hourly_rate, 45) * 0.85;

    SELECT jsonb_build_object(
        'monthlyEarnings', v_total_earnings,
        'hourlyRate', COALESCE(v_prof.hourly_rate, 45),
        'currency', COALESCE(v_prof.currency, 'USD'),
        'completedLessons', COALESCE(v_prof.total_lessons, v_month_lessons),
        'activeStudents', GREATEST(v_active_students_count, COALESCE(v_prof.total_students, 0)),
        'averageRating', COALESCE(v_prof.average_rating, 5.0),
        'reviewCount', COALESCE(v_prof.review_count, 0),
        'attendanceRate', COALESCE(v_prof.attendance_rate, 100),
        'responseTimeMinutes', COALESCE(v_prof.response_time_minutes, 15),
        'isSuperTutor', COALESCE(v_prof.is_super_tutor, true),
        'accountStatus', COALESCE(v_prof.account_status, 'ACTIVE')
    ) INTO v_stats;

    -- 4. Build Final Document
    SELECT jsonb_build_object(
        'tutorId', v_prof.id,
        'userId', v_prof.user_id,
        'slug', v_prof.slug,
        'headline', v_prof.headline,
        'user', jsonb_build_object(
            'id', v_user.id,
            'email', v_user.email,
            'displayName', v_user.display_name,
            'avatarUrl', v_user.avatar_url,
            'country', v_user.country,
            'timezone', v_user.timezone
        ),
        'stats', v_stats,
        'upcomingLessons', v_upcoming_lessons,
        'recentReviews', v_recent_reviews
    ) INTO result;

    RETURN result;
END;
$$;
