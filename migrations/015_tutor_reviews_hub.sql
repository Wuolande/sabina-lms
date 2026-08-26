-- ====================================================================
-- MIGRATION 015: Tutor Reviews & Reputation Hub Procedures
-- ====================================================================

-- 1. Stored Procedure: get_tutor_reviews_360
CREATE OR REPLACE FUNCTION public.get_tutor_reviews_360(p_tutor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INT;
    v_avg NUMERIC(3,2);
    v_c5 INT;
    v_c4 INT;
    v_c3 INT;
    v_c2 INT;
    v_c1 INT;
    v_replied INT;
    v_unreplied INT;
    v_reviews JSONB;
    result JSONB;
BEGIN
    -- Aggregates
    SELECT 
        COUNT(*),
        COALESCE(ROUND(AVG(rating)::numeric, 2), 5.0),
        COUNT(*) FILTER (WHERE rating = 5),
        COUNT(*) FILTER (WHERE rating = 4),
        COUNT(*) FILTER (WHERE rating = 3),
        COUNT(*) FILTER (WHERE rating = 2),
        COUNT(*) FILTER (WHERE rating = 1),
        COUNT(*) FILTER (WHERE tutor_reply IS NOT NULL AND trim(tutor_reply) <> ''),
        COUNT(*) FILTER (WHERE tutor_reply IS NULL OR trim(tutor_reply) = '')
    INTO 
        v_total, v_avg, v_c5, v_c4, v_c3, v_c2, v_c1, v_replied, v_unreplied
    FROM public.lesson_reviews
    WHERE tutor_id = p_tutor_id;

    -- Reviews list
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', r.id,
        'lessonId', r.lesson_id,
        'studentId', r.student_id,
        'studentName', COALESCE(u.display_name, 'Anonymous Student'),
        'studentAvatar', u.avatar_url,
        'studentEmail', u.email,
        'subjectName', COALESCE(b.subject_name, 'General Tutoring'),
        'lessonDate', l.scheduled_start,
        'rating', r.rating,
        'comment', r.comment,
        'tutorReply', r.tutor_reply,
        'tutorRepliedAt', r.tutor_replied_at,
        'createdAt', r.created_at
    ) ORDER BY r.created_at DESC), '[]'::jsonb)
    INTO v_reviews
    FROM public.lesson_reviews r
    LEFT JOIN public.users u ON u.id = r.student_id
    LEFT JOIN public.lessons l ON l.id = r.lesson_id
    LEFT JOIN public.bookings b ON b.id = l.booking_id
    WHERE r.tutor_id = p_tutor_id;

    -- Aggregate JSON
    SELECT jsonb_build_object(
        'tutorId', p_tutor_id,
        'stats', jsonb_build_object(
            'averageRating', v_avg,
            'totalReviews', v_total,
            'fiveStarCount', v_c5,
            'fourStarCount', v_c4,
            'threeStarCount', v_c3,
            'twoStarCount', v_c2,
            'oneStarCount', v_c1,
            'repliedCount', v_replied,
            'unrepliedCount', v_unreplied,
            'fiveStarPercent', CASE WHEN v_total > 0 THEN ROUND((v_c5::numeric / v_total::numeric) * 100) ELSE 100 END,
            'responseRatePercent', CASE WHEN v_total > 0 THEN ROUND((v_replied::numeric / v_total::numeric) * 100) ELSE 0 END
        ),
        'reviews', v_reviews
    ) INTO result;

    RETURN result;
END;
$$;

-- 2. Stored Procedure: reply_to_review_atomic
CREATE OR REPLACE FUNCTION public.reply_to_review_atomic(
    p_review_id UUID,
    p_tutor_id UUID,
    p_reply TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rev RECORD;
    v_tutor_user_id UUID;
    v_tutor_name TEXT;
BEGIN
    -- Update review
    UPDATE public.lesson_reviews
    SET 
        tutor_reply = trim(p_reply),
        tutor_replied_at = now()
    WHERE id = p_review_id AND tutor_id = p_tutor_id
    RETURNING * INTO v_rev;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Review not found or does not belong to tutor';
    END IF;

    -- Fetch tutor display name
    SELECT u.display_name INTO v_tutor_name
    FROM public.tutor_profiles tp
    JOIN public.users u ON u.id = tp.user_id
    WHERE tp.id = p_tutor_id;

    -- Generate notification for student
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        body,
        action_url
    ) VALUES (
        v_rev.student_id,
        'REVIEW_RECEIVED',
        COALESCE(v_tutor_name, 'Your tutor') || ' replied to your lesson review',
        trim(p_reply),
        '/student/lessons'
    );

    RETURN jsonb_build_object(
        'id', v_rev.id,
        'tutorReply', v_rev.tutor_reply,
        'tutorRepliedAt', v_rev.tutor_replied_at
    );
END;
$$;
