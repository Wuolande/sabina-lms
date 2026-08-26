-- ====================================================================
-- MIGRATION 017: Tutor Re-Verification on Sensitive Edits & Audit Sync
-- ====================================================================

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
    v_tutor_name TEXT;
    v_reverify_needed BOOLEAN := false;
    v_reverify_details TEXT := '';
    item JSONB;
    v_is_ver BOOLEAN;
BEGIN
    SELECT tp.user_id, u.display_name INTO v_user_id, v_tutor_name
    FROM public.tutor_profiles tp
    JOIN public.users u ON u.id = tp.user_id
    WHERE tp.id = p_tutor_id;

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

    -- 3. Sync Educations (New/edited educations default to is_verified = false)
    IF p_payload ? 'educations' THEN
        -- Check for new items
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
                tutor_id, degree, field_of_study, institution, start_year, end_year, honors, is_verified
            ) VALUES (
                p_tutor_id,
                item->>'degree',
                item->>'fieldOfStudy',
                item->>'institution',
                (item->>'startYear')::INT,
                (item->>'endYear')::INT,
                item->>'honors',
                v_is_ver
            );
        END LOOP;
    END IF;

    -- 4. Sync Certifications (New/edited certifications default to is_verified = false)
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
                tutor_id, title, issuer, issue_year, credential_id, certificate_url, is_verified
            ) VALUES (
                p_tutor_id,
                item->>'title',
                item->>'issuer',
                (item->>'issueYear')::INT,
                item->>'credentialId',
                item->>'certificateUrl',
                v_is_ver
            );
        END LOOP;
    END IF;

    -- 5. Sync Experiences
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

    -- 6. If reverification was triggered on degrees or certificates, write audit log
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
            'Tutor updated credentials requiring academic board review:' || v_reverify_details
        );
    END IF;

    RETURN public.get_tutor_public_profile(p_tutor_id::TEXT);
END;
$$;
