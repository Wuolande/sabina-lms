-- Migration 034: Exclude Unverified Tutors from Public Marketplace
-- Ensures only tutors with verification_status IN ('APPROVED', 'VERIFIED') and account_status = 'ACTIVE' appear in public marketplace search

CREATE OR REPLACE FUNCTION public.get_marketplace_tutors(
    p_search text DEFAULT NULL::text, 
    p_category text DEFAULT NULL::text, 
    p_subject text DEFAULT NULL::text, 
    p_country text DEFAULT NULL::text, 
    p_language text DEFAULT NULL::text, 
    p_min_price numeric DEFAULT NULL::numeric, 
    p_max_price numeric DEFAULT NULL::numeric, 
    p_rating numeric DEFAULT NULL::numeric, 
    p_is_featured boolean DEFAULT NULL::boolean, 
    p_is_super_tutor boolean DEFAULT NULL::boolean, 
    p_sort_by text DEFAULT 'popularity'::text, 
    p_limit integer DEFAULT 20, 
    p_offset integer DEFAULT 0
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_total INT;
    v_tutors JSONB;
BEGIN
    -- Base filtered CTE
    WITH filtered_tutors AS (
        SELECT 
            tp.id,
            tp.user_id,
            tp.slug,
            tp.headline,
            tp.bio,
            tp.hourly_rate,
            tp.currency,
            tp.years_experience,
            tp.teaching_style,
            tp.intro_video_url,
            tp.video_thumbnail,
            tp.verification_status,
            tp.account_status,
            tp.average_rating,
            tp.review_count,
            tp.total_lessons,
            tp.total_students,
            tp.is_featured,
            tp.is_super_tutor,
            tp.response_time_minutes,
            tp.attendance_rate,
            tp.repeat_student_rate,
            tp.created_at,
            tp.updated_at,
            u.display_name,
            u.first_name,
            u.last_name,
            u.email,
            u.avatar_url,
            u.country,
            u.timezone,
            u.preferred_language,
            u.status as user_status
        FROM public.tutor_profiles tp
        JOIN public.users u ON u.id = tp.user_id
        WHERE tp.account_status = 'ACTIVE'
          AND tp.verification_status IN ('APPROVED', 'VERIFIED')
          AND tp.deleted_at IS NULL
          AND (p_is_featured IS NULL OR tp.is_featured = p_is_featured)
          AND (p_is_super_tutor IS NULL OR tp.is_super_tutor = p_is_super_tutor)
          AND (p_min_price IS NULL OR tp.hourly_rate >= p_min_price)
          AND (p_max_price IS NULL OR tp.hourly_rate <= p_max_price)
          AND (p_rating IS NULL OR tp.average_rating >= p_rating)
          AND (p_country IS NULL OR p_country = 'all' OR LOWER(u.country) LIKE '%' || LOWER(p_country) || '%')
          AND (
              p_search IS NULL OR p_search = '' OR
              LOWER(u.display_name) LIKE '%' || LOWER(p_search) || '%' OR
              LOWER(tp.headline) LIKE '%' || LOWER(p_search) || '%' OR
              LOWER(tp.bio) LIKE '%' || LOWER(p_search) || '%' OR
              EXISTS (
                  SELECT 1 FROM public.tutor_subjects ts
                  JOIN public.subjects s ON s.id = ts.subject_id
                  WHERE ts.tutor_id = tp.id AND (
                      LOWER(s.name) LIKE '%' || LOWER(p_search) || '%' OR
                      LOWER(s.slug) LIKE '%' || LOWER(p_search) || '%'
                  )
              )
          )
          AND (
              p_subject IS NULL OR p_subject = 'all' OR
              EXISTS (
                  SELECT 1 FROM public.tutor_subjects ts
                  JOIN public.subjects s ON s.id = ts.subject_id
                  WHERE ts.tutor_id = tp.id AND (
                      s.slug = LOWER(p_subject) OR 
                      LOWER(s.name) LIKE '%' || LOWER(p_subject) || '%' OR
                      s.id::TEXT = p_subject
                  )
              )
          )
          AND (
              p_category IS NULL OR p_category = 'all' OR
              EXISTS (
                  SELECT 1 FROM public.tutor_subjects ts
                  JOIN public.subjects s ON s.id = ts.subject_id
                  WHERE ts.tutor_id = tp.id AND (
                      LOWER(s.category) LIKE '%' || LOWER(p_category) || '%'
                  )
              )
          )
          AND (
              p_language IS NULL OR p_language = 'all' OR
              EXISTS (
                  SELECT 1 FROM public.tutor_languages tl
                  JOIN public.languages l ON l.id = tl.language_id
                  WHERE tl.tutor_id = tp.id AND (
                      LOWER(l.code) = LOWER(p_language) OR
                      LOWER(l.name) LIKE '%' || LOWER(p_language) || '%'
                  )
              )
          )
    ),
    counted AS (
        SELECT COUNT(*) as total_count FROM filtered_tutors
    ),
    sorted_tutors AS (
        SELECT ft.*
        FROM filtered_tutors ft
        ORDER BY
            CASE WHEN p_sort_by = 'price_asc' THEN ft.hourly_rate END ASC,
            CASE WHEN p_sort_by = 'price_desc' THEN ft.hourly_rate END DESC,
            CASE WHEN p_sort_by = 'rating' THEN ft.average_rating END DESC,
            CASE WHEN p_sort_by = 'reviews' THEN ft.review_count END DESC,
            CASE WHEN p_sort_by = 'popularity' OR p_sort_by IS NULL THEN (CASE WHEN ft.is_featured THEN 1 ELSE 0 END) END DESC,
            ft.total_lessons DESC
        LIMIT p_limit
        OFFSET p_offset
    ),
    aggregated_tutors AS (
        SELECT 
            st.*,
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', ts.id,
                            'tutorId', ts.tutor_id,
                            'subjectId', ts.subject_id,
                            'isPrimary', ts.is_primary,
                            'levels', ts.levels,
                            'subject', jsonb_build_object(
                                'id', s.id,
                                'name', s.name,
                                'slug', s.slug,
                                'category', s.category,
                                'description', COALESCE(s.description, ''),
                                'popular', true,
                                'tutorCount', 10
                            )
                        )
                    )
                    FROM public.tutor_subjects ts
                    JOIN public.subjects s ON s.id = ts.subject_id
                    WHERE ts.tutor_id = st.id
                ), '[]'::jsonb
            ) as subjects_list,
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', tl.id,
                            'tutorId', tl.tutor_id,
                            'languageId', tl.language_id,
                            'proficiency', CASE WHEN tl.proficiency = 'NATIVE' THEN 'Native' WHEN tl.proficiency = 'FLUENT' THEN 'Fluent' ELSE 'Advanced' END,
                            'isPrimary', tl.proficiency = 'NATIVE',
                            'language', jsonb_build_object(
                                'id', l.id,
                                'name', l.name,
                                'code', l.code,
                                'nativeName', l.native_name
                            )
                        )
                    )
                    FROM public.tutor_languages tl
                    JOIN public.languages l ON l.id = tl.language_id
                    WHERE tl.tutor_id = st.id
                ), '[]'::jsonb
            ) as languages_list,
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', ar.id,
                            'tutorId', ar.tutor_id,
                            'dayOfWeek', ar.day_of_week,
                            'startTime', ar.start_time,
                            'endTime', ar.end_time,
                            'isActive', ar.is_active
                        )
                    )
                    FROM public.tutor_availability_rules ar
                    WHERE ar.tutor_id = st.id
                ), '[]'::jsonb
            ) as availability_rules_list
        FROM sorted_tutors st
    )
    SELECT 
        (SELECT total_count FROM counted),
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', a.id,
                    'userId', a.user_id,
                    'slug', a.slug,
                    'headline', a.headline,
                    'bio', a.bio,
                    'hourlyRate', a.hourly_rate,
                    'currency', a.currency,
                    'yearsExperience', a.years_experience,
                    'teachingStyle', a.teaching_style,
                    'videoIntroUrl', a.intro_video_url,
                    'videoThumbnail', a.video_thumbnail,
                    'verificationStatus', a.verification_status,
                    'accountStatus', a.account_status,
                    'averageRating', a.average_rating,
                    'reviewCount', a.review_count,
                    'totalLessons', a.total_lessons,
                    'totalStudents', a.total_students,
                    'isFeatured', a.is_featured,
                    'isSuperTutor', a.is_super_tutor,
                    'responseTimeMinutes', a.response_time_minutes,
                    'attendanceRate', a.attendance_rate,
                    'repeatStudentRate', a.repeat_student_rate,
                    'createdAt', a.created_at,
                    'updatedAt', a.updated_at,
                    'user', jsonb_build_object(
                        'id', a.user_id,
                        'email', a.email,
                        'role', 'TUTOR',
                        'firstName', a.first_name,
                        'lastName', a.last_name,
                        'displayName', a.display_name,
                        'avatarUrl', a.avatar_url,
                        'country', a.country,
                        'timezone', a.timezone,
                        'preferredLanguage', a.preferred_language,
                        'status', a.user_status,
                        'createdAt', a.created_at,
                        'updatedAt', a.updated_at
                    ),
                    'subjects', a.subjects_list,
                    'languages', a.languages_list,
                    'education', '[]'::jsonb,
                    'certifications', '[]'::jsonb,
                    'availabilityRules', a.availability_rules_list,
                    'exceptions', '[]'::jsonb
                )
            ), '[]'::jsonb
        )
    INTO v_total, v_tutors
    FROM aggregated_tutors a;

    RETURN jsonb_build_object(
        'total', COALESCE(v_total, 0),
        'tutors', COALESCE(v_tutors, '[]'::jsonb)
    );
END;
$function$;
