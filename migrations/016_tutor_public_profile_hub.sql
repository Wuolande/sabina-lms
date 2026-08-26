-- ====================================================================
-- MIGRATION 016: Tutor Public Profile Hub & Atomic Sync Procedures
-- ====================================================================

-- 1. Stored Procedure: get_tutor_public_profile
CREATE OR REPLACE FUNCTION public.get_tutor_public_profile(p_slug_or_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tutor_id UUID;
    v_prof RECORD;
    v_user RECORD;
    v_subjects JSONB;
    v_languages JSONB;
    v_educations JSONB;
    v_certifications JSONB;
    v_experiences JSONB;
    v_reviews JSONB;
    result JSONB;
BEGIN
    -- Find tutor ID by UUID or slug
    IF p_slug_or_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        SELECT * INTO v_prof FROM public.tutor_profiles WHERE id = p_slug_or_id::UUID;
    ELSE
        SELECT * INTO v_prof FROM public.tutor_profiles WHERE slug = p_slug_or_id;
    END IF;

    IF v_prof IS NULL THEN
        RETURN NULL;
    END IF;

    v_tutor_id := v_prof.id;

    -- Fetch user
    SELECT id, email, display_name, avatar_url, country, timezone
    INTO v_user
    FROM public.users
    WHERE id = v_prof.user_id;

    -- Fetch subjects
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ts.id,
        'subjectId', ts.subject_id,
        'name', s.name,
        'slug', s.slug,
        'category', s.category,
        'levels', ts.levels,
        'isPrimary', ts.is_primary
    ) ORDER BY ts.is_primary DESC, s.name ASC), '[]'::jsonb)
    INTO v_subjects
    FROM public.tutor_subjects ts
    JOIN public.subjects s ON s.id = ts.subject_id
    WHERE ts.tutor_id = v_tutor_id;

    -- Fetch languages
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', tl.id,
        'languageId', tl.language_id,
        'name', l.name,
        'code', l.code,
        'proficiency', tl.proficiency
    ) ORDER BY l.name ASC), '[]'::jsonb)
    INTO v_languages
    FROM public.tutor_languages tl
    JOIN public.languages l ON l.id = tl.language_id
    WHERE tl.tutor_id = v_tutor_id;

    -- Fetch educations
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', e.id,
        'degree', e.degree,
        'fieldOfStudy', e.field_of_study,
        'institution', e.institution,
        'startYear', e.start_year,
        'endYear', e.end_year,
        'honors', e.honors,
        'isVerified', e.is_verified
    ) ORDER BY e.end_year DESC NULLS FIRST), '[]'::jsonb)
    INTO v_educations
    FROM public.tutor_educations e
    WHERE e.tutor_id = v_tutor_id;

    -- Fetch certifications
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'issuer', c.issuer,
        'issueYear', c.issue_year,
        'credentialId', c.credential_id,
        'certificateUrl', c.certificate_url,
        'isVerified', c.is_verified
    ) ORDER BY c.issue_year DESC NULLS FIRST), '[]'::jsonb)
    INTO v_certifications
    FROM public.tutor_certifications c
    WHERE c.tutor_id = v_tutor_id;

    -- Fetch experiences
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', exp.id,
        'role', exp.role,
        'organization', exp.organization,
        'location', exp.location,
        'startYear', exp.start_year,
        'endYear', exp.end_year,
        'description', exp.description
    ) ORDER BY exp.start_year DESC NULLS FIRST), '[]'::jsonb)
    INTO v_experiences
    FROM public.tutor_experiences exp
    WHERE exp.tutor_id = v_tutor_id;

    -- Fetch verified reviews
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
    INTO v_reviews
    FROM public.lesson_reviews r
    LEFT JOIN public.users u ON u.id = r.student_id
    LEFT JOIN public.lessons l ON l.id = r.lesson_id
    LEFT JOIN public.bookings b ON b.id = l.booking_id
    WHERE r.tutor_id = v_tutor_id;

    -- Build final document
    SELECT jsonb_build_object(
        'id', v_prof.id,
        'userId', v_prof.user_id,
        'slug', v_prof.slug,
        'headline', v_prof.headline,
        'bio', v_prof.bio,
        'hourlyRate', v_prof.hourly_rate,
        'currency', v_prof.currency,
        'yearsExperience', v_prof.years_experience,
        'teachingStyle', v_prof.teaching_style,
        'introVideoUrl', v_prof.intro_video_url,
        'videoThumbnail', v_prof.video_thumbnail,
        'verificationStatus', v_prof.verification_status,
        'accountStatus', v_prof.account_status,
        'averageRating', COALESCE(v_prof.average_rating, 5.0),
        'reviewCount', COALESCE(v_prof.review_count, 0),
        'totalLessons', COALESCE(v_prof.total_lessons, 0),
        'totalStudents', COALESCE(v_prof.total_students, 0),
        'isFeatured', COALESCE(v_prof.is_featured, false),
        'isSuperTutor', COALESCE(v_prof.is_super_tutor, false),
        'responseTimeMinutes', COALESCE(v_prof.response_time_minutes, 15),
        'attendanceRate', COALESCE(v_prof.attendance_rate, 100),
        'repeatStudentRate', COALESCE(v_prof.repeat_student_rate, 88),
        'user', jsonb_build_object(
            'id', v_user.id,
            'email', v_user.email,
            'displayName', v_user.display_name,
            'avatarUrl', v_user.avatar_url,
            'country', v_user.country,
            'timezone', v_user.timezone
        ),
        'subjects', v_subjects,
        'languages', v_languages,
        'educations', v_educations,
        'certifications', v_certifications,
        'experiences', v_experiences,
        'reviews', v_reviews
    ) INTO result;

    RETURN result;
END;
$$;

-- 2. Stored Procedure: update_tutor_public_profile_atomic
CREATE OR REPLACE FUNCTION public.update_tutor_public_profile_atomic(
    p_tutor_id UUID,
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    item JSONB;
BEGIN
    SELECT user_id INTO v_user_id
    FROM public.tutor_profiles
    WHERE id = p_tutor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tutor profile not found';
    END IF;

    -- 1. Update user fields
    IF p_payload ? 'displayName' OR p_payload ? 'avatarUrl' OR p_payload ? 'country' OR p_payload ? 'timezone' THEN
        UPDATE public.users
        SET 
            display_name = COALESCE(p_payload->>'displayName', display_name),
            avatar_url = COALESCE(p_payload->>'avatarUrl', avatar_url),
            country = COALESCE(p_payload->>'country', country),
            timezone = COALESCE(p_payload->>'timezone', timezone),
            updated_at = now()
        WHERE id = v_user_id;
    END IF;

    -- 2. Update tutor_profiles fields
    UPDATE public.tutor_profiles
    SET 
        headline = COALESCE(p_payload->>'headline', headline),
        bio = COALESCE(p_payload->>'bio', bio),
        teaching_style = COALESCE(p_payload->>'teachingStyle', teaching_style),
        hourly_rate = COALESCE((p_payload->>'hourlyRate')::NUMERIC, hourly_rate),
        currency = COALESCE(p_payload->>'currency', currency),
        years_experience = COALESCE((p_payload->>'yearsExperience')::INT, years_experience),
        intro_video_url = COALESCE(p_payload->>'introVideoUrl', intro_video_url),
        video_thumbnail = COALESCE(p_payload->>'videoThumbnail', video_thumbnail),
        updated_at = now()
    WHERE id = p_tutor_id;

    -- 3. Sync Educations if provided
    IF p_payload ? 'educations' THEN
        DELETE FROM public.tutor_educations WHERE tutor_id = p_tutor_id;
        FOR item IN SELECT * FROM jsonb_array_elements(p_payload->'educations')
        LOOP
            INSERT INTO public.tutor_educations (
                tutor_id, degree, field_of_study, institution, start_year, end_year, honors, is_verified
            ) VALUES (
                p_tutor_id,
                item->>'degree',
                item->>'fieldOfStudy',
                item->>'institution',
                (item->>'startYear')::INT,
                (item->>'endYear')::INT,
                item->>'honors',
                COALESCE((item->>'isVerified')::BOOLEAN, true)
            );
        END LOOP;
    END IF;

    -- 4. Sync Certifications if provided
    IF p_payload ? 'certifications' THEN
        DELETE FROM public.tutor_certifications WHERE tutor_id = p_tutor_id;
        FOR item IN SELECT * FROM jsonb_array_elements(p_payload->'certifications')
        LOOP
            INSERT INTO public.tutor_certifications (
                tutor_id, title, issuer, issue_year, credential_id, certificate_url, is_verified
            ) VALUES (
                p_tutor_id,
                item->>'title',
                item->>'issuer',
                (item->>'issueYear')::INT,
                item->>'credentialId',
                item->>'certificateUrl',
                COALESCE((item->>'isVerified')::BOOLEAN, true)
            );
        END LOOP;
    END IF;

    -- 5. Sync Experiences if provided
    IF p_payload ? 'experiences' THEN
        DELETE FROM public.tutor_experiences WHERE tutor_id = p_tutor_id;
        FOR item IN SELECT * FROM jsonb_array_elements(p_payload->'experiences')
        LOOP
            INSERT INTO public.tutor_experiences (
                tutor_id, role, organization, location, start_year, end_year, description
            ) VALUES (
                p_tutor_id,
                item->>'role',
                item->>'organization',
                item->>'location',
                (item->>'startYear')::INT,
                (item->>'endYear')::INT,
                item->>'description'
            );
        END LOOP;
    END IF;

    RETURN public.get_tutor_public_profile(p_tutor_id::TEXT);
END;
$$;
