-- ====================================================================
-- MIGRATION 035: Tutor Verification Status & Application Sync
-- ====================================================================

-- 1. Extend tutor_profiles verification_status check constraint to accept both APPROVED and VERIFIED
ALTER TABLE public.tutor_profiles DROP CONSTRAINT IF EXISTS tutor_profiles_verification_status_check;
ALTER TABLE public.tutor_profiles ADD CONSTRAINT tutor_profiles_verification_status_check 
  CHECK (verification_status IN ('PENDING', 'APPROVED', 'VERIFIED', 'REJECTED'));

-- 2. Add document columns to tutor_educations and tutor_certifications for document persistence
ALTER TABLE public.tutor_educations 
  ADD COLUMN IF NOT EXISTS document_url TEXT,
  ADD COLUMN IF NOT EXISTS document_name TEXT;

ALTER TABLE public.tutor_certifications 
  ADD COLUMN IF NOT EXISTS document_name TEXT;

-- 3. Update get_tutor_public_profile_hub to return documentUrl and documentName for educations & certifications
CREATE OR REPLACE FUNCTION public.get_tutor_public_profile_hub(
    p_identifier TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tutor_id UUID;
    v_prof public.tutor_profiles%ROWTYPE;
    v_user public.users%ROWTYPE;
    v_subjects JSONB;
    v_languages JSONB;
    v_educations JSONB;
    v_certifications JSONB;
    v_experiences JSONB;
    v_reviews JSONB;
    v_stats JSONB;
    v_res JSONB;
BEGIN
    IF p_identifier ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        SELECT * INTO v_prof FROM public.tutor_profiles WHERE id = p_identifier::UUID;
    END IF;

    IF v_prof.id IS NULL THEN
        SELECT * INTO v_prof FROM public.tutor_profiles WHERE slug = p_identifier;
    END IF;

    IF v_prof.id IS NULL THEN
        RETURN NULL;
    END IF;

    v_tutor_id := v_prof.id;

    SELECT * INTO v_user FROM public.users WHERE id = v_prof.user_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'slug', s.slug,
        'category', s.category,
        'isPrimary', ts.is_primary,
        'levels', ts.levels
    ) ORDER BY ts.is_primary DESC, s.name ASC), '[]'::jsonb)
    INTO v_subjects
    FROM public.tutor_subjects ts
    JOIN public.subjects s ON s.id = ts.subject_id
    WHERE ts.tutor_id = v_tutor_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'code', l.code,
        'nativeName', l.native_name,
        'proficiency', tl.proficiency
    ) ORDER BY l.name ASC), '[]'::jsonb)
    INTO v_languages
    FROM public.tutor_languages tl
    JOIN public.languages l ON l.id = tl.language_id
    WHERE tl.tutor_id = v_tutor_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', e.id,
        'degree', e.degree,
        'fieldOfStudy', e.field_of_study,
        'institution', e.institution,
        'startYear', e.start_year,
        'endYear', e.end_year,
        'honors', e.honors,
        'documentUrl', e.document_url,
        'documentName', e.document_name,
        'isVerified', e.is_verified
    ) ORDER BY e.end_year DESC NULLS FIRST), '[]'::jsonb)
    INTO v_educations
    FROM public.tutor_educations e
    WHERE e.tutor_id = v_tutor_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'issuer', c.issuer,
        'issueYear', c.issue_year,
        'credentialId', c.credential_id,
        'certificateUrl', c.certificate_url,
        'documentUrl', c.certificate_url,
        'documentName', c.document_name,
        'isVerified', c.is_verified
    ) ORDER BY c.issue_year DESC NULLS FIRST), '[]'::jsonb)
    INTO v_certifications
    FROM public.tutor_certifications c
    WHERE c.tutor_id = v_tutor_id;

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

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', r.id,
        'rating', r.rating,
        'comment', r.comment,
        'tutorReply', r.tutor_reply,
        'tutorRepliedAt', r.tutor_replied_at,
        'createdAt', r.created_at,
        'student', jsonb_build_object(
            'displayName', stu.display_name,
            'avatarUrl', stu.avatar_url,
            'country', stu.country
        )
    ) ORDER BY r.created_at DESC), '[]'::jsonb)
    INTO v_reviews
    FROM public.reviews r
    JOIN public.users stu ON stu.id = r.student_id
    WHERE r.tutor_id = v_tutor_id AND r.is_published = true;

    SELECT jsonb_build_object(
        'averageRating', COALESCE(ROUND(AVG(r.rating)::numeric, 1), 5.0),
        'totalReviews', COUNT(r.id),
        'totalLessons', (SELECT COUNT(*) FROM public.bookings b WHERE b.tutor_id = v_tutor_id AND b.status = 'COMPLETED'),
        'totalStudents', (SELECT COUNT(DISTINCT b.student_id) FROM public.bookings b WHERE b.tutor_id = v_tutor_id AND b.status = 'COMPLETED'),
        'attendanceRate', 99,
        'responseRateHours', 1
    )
    INTO v_stats
    FROM public.reviews r
    WHERE r.tutor_id = v_tutor_id AND r.is_published = true;

    v_res := jsonb_build_object(
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
        'accountStatus', v_prof.account_status,
        'verificationStatus', v_prof.verification_status,
        'isFeatured', v_prof.is_featured,
        'isSuperTutor', v_prof.is_super_tutor,
        'applicationId', v_prof.application_id,
        'user', jsonb_build_object(
            'displayName', v_user.display_name,
            'avatarUrl', v_user.avatar_url,
            'country', v_user.country,
            'timezone', v_user.timezone,
            'createdAt', v_user.created_at
        ),
        'subjects', v_subjects,
        'languages', v_languages,
        'educations', v_educations,
        'certifications', v_certifications,
        'experiences', v_experiences,
        'reviews', v_reviews,
        'stats', v_stats
    );

    RETURN v_res;
END;
$$;

-- 4. Update update_tutor_public_profile_atomic to sync documents and application details
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
    v_app_id UUID;
    v_tutor_name TEXT;
    v_reverify_needed BOOLEAN := false;
    v_reverify_details TEXT := '';
    item JSONB;
    v_is_ver BOOLEAN;
BEGIN
    SELECT tp.user_id, tp.application_id, u.display_name 
    INTO v_user_id, v_app_id, v_tutor_name
    FROM public.tutor_profiles tp
    JOIN public.users u ON u.id = tp.user_id
    WHERE tp.id = p_tutor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tutor profile not found';
    END IF;

    IF v_app_id IS NULL THEN
        SELECT id INTO v_app_id FROM public.tutor_applications WHERE applicant_user_id = v_user_id;
        IF v_app_id IS NULL THEN
            INSERT INTO public.tutor_applications (
                applicant_user_id, status, headline, bio, hourly_rate, currency, years_experience, submitted_at
            ) VALUES (
                v_user_id, 'APPROVED', COALESCE(p_payload->>'headline', 'Instructor at Sabina LMS'),
                COALESCE(p_payload->>'bio', ''), COALESCE((p_payload->>'hourlyRate')::NUMERIC, 25.0),
                COALESCE(p_payload->>'currency', 'USD'), COALESCE((p_payload->>'yearsExperience')::INT, 1),
                now()
            ) RETURNING id INTO v_app_id;
        END IF;

        UPDATE public.tutor_profiles SET application_id = v_app_id WHERE id = p_tutor_id;
    END IF;

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

    IF v_app_id IS NOT NULL THEN
        UPDATE public.tutor_applications
        SET 
            headline = COALESCE(p_payload->>'headline', headline),
            bio = COALESCE(p_payload->>'bio', bio),
            teaching_style = COALESCE(p_payload->>'teachingStyle', teaching_style),
            hourly_rate = COALESCE((p_payload->>'hourlyRate')::NUMERIC, hourly_rate),
            currency = COALESCE(p_payload->>'currency', currency),
            years_experience = COALESCE((p_payload->>'yearsExperience')::INT, years_experience),
            intro_video_url = COALESCE(p_payload->>'introVideoUrl', intro_video_url),
            updated_at = now()
        WHERE id = v_app_id;
    END IF;

    IF p_payload ? 'educations' THEN
        FOR item IN SELECT * FROM jsonb_array_elements(p_payload->'educations')
        LOOP
            IF NOT (item ? 'id') OR (item->>'id' IS NULL) OR (item->>'isVerified')::BOOLEAN IS NOT TRUE THEN
                v_reverify_needed := true;
                v_reverify_details := v_reverify_details || ' New/Edited Degree: ' || COALESCE(item->>'degree', 'Degree');
            END IF;
        END LOOP;

        DELETE FROM public.tutor_educations WHERE tutor_id = p_tutor_id;
        FOR item IN SELECT * FROM jsonb_array_elements(p_payload->'educations')
        LOOP
            v_is_ver := COALESCE((item->>'isVerified')::BOOLEAN, false);

            INSERT INTO public.tutor_educations (
                tutor_id, degree, field_of_study, institution, start_year, end_year, honors, is_verified, document_url, document_name
            ) VALUES (
                p_tutor_id,
                item->>'degree',
                item->>'fieldOfStudy',
                item->>'institution',
                (item->>'startYear')::INT,
                (item->>'endYear')::INT,
                item->>'honors',
                v_is_ver,
                item->>'documentUrl',
                item->>'documentName'
            );

            IF (item->>'documentUrl') IS NOT NULL AND length(trim(item->>'documentUrl')) > 0 AND v_app_id IS NOT NULL THEN
                INSERT INTO public.tutor_application_documents (
                    application_id, document_type, title, file_url, verification_status
                ) VALUES (
                    v_app_id,
                    'DEGREE_CERTIFICATE',
                    'Diploma: ' || COALESCE(item->>'degree', 'Degree') || ' (' || COALESCE(item->>'institution', '') || ')',
                    trim(item->>'documentUrl'),
                    CASE WHEN v_is_ver THEN 'VERIFIED' ELSE 'PENDING' END
                );
            END IF;
        END LOOP;
    END IF;

    IF p_payload ? 'certifications' THEN
        FOR item IN SELECT * FROM jsonb_array_elements(p_payload->'certifications')
        LOOP
            IF NOT (item ? 'id') OR (item->>'id' IS NULL) OR (item->>'isVerified')::BOOLEAN IS NOT TRUE THEN
                v_reverify_needed := true;
                v_reverify_details := v_reverify_details || ' New/Edited Certificate: ' || COALESCE(item->>'title', 'Certification');
            END IF;
        END LOOP;

        DELETE FROM public.tutor_certifications WHERE tutor_id = p_tutor_id;
        FOR item IN SELECT * FROM jsonb_array_elements(p_payload->'certifications')
        LOOP
            v_is_ver := COALESCE((item->>'isVerified')::BOOLEAN, false);

            INSERT INTO public.tutor_certifications (
                tutor_id, title, issuer, issue_year, credential_id, certificate_url, document_name, is_verified
            ) VALUES (
                p_tutor_id,
                item->>'title',
                item->>'issuer',
                (item->>'issueYear')::INT,
                item->>'credentialId',
                item->>'certificateUrl',
                item->>'documentName',
                v_is_ver
            );

            IF (item->>'certificateUrl') IS NOT NULL AND length(trim(item->>'certificateUrl')) > 0 AND v_app_id IS NOT NULL THEN
                INSERT INTO public.tutor_application_documents (
                    application_id, document_type, title, file_url, verification_status
                ) VALUES (
                    v_app_id,
                    'TEACHING_CREDENTIAL',
                    'Credential: ' || COALESCE(item->>'title', 'Certificate') || ' (' || COALESCE(item->>'issuer', '') || ')',
                    trim(item->>'certificateUrl'),
                    CASE WHEN v_is_ver THEN 'VERIFIED' ELSE 'PENDING' END
                );
            END IF;
        END LOOP;
    END IF;

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

    IF v_reverify_needed THEN
        INSERT INTO public.audit_logs (
            actor_user_id,
            actor_name,
            actor_role,
            action,
            entity_type,
            entity_id,
            details
        ) VALUES (
            v_user_id,
            v_tutor_name,
            'TUTOR',
            'TUTOR_CREDENTIALS_REVERIFICATION_TRIGGERED',
            'TUTOR_PROFILE',
            p_tutor_id,
            'Credentials edited needing verification: ' || v_reverify_details
        );
    END IF;

    RETURN public.get_tutor_public_profile_hub(p_tutor_id::TEXT);
END;
$$;
