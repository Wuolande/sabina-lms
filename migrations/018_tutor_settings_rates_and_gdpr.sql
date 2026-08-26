-- ====================================================================
-- MIGRATION 018: Tutor Settings, Rates, Payouts & GDPR Privacy Governance
-- ====================================================================

-- 1. Schema Extensions & Account Status Constraint on tutor_profiles
ALTER TABLE public.tutor_profiles
DROP CONSTRAINT IF EXISTS tutor_profiles_account_status_check;

ALTER TABLE public.tutor_profiles
ADD CONSTRAINT tutor_profiles_account_status_check
CHECK (account_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DEACTIVATED', 'DELETED', 'PENDING', 'PAUSED'));

ALTER TABLE public.tutor_profiles
ADD COLUMN IF NOT EXISTS trial_lesson_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS trial_lesson_price NUMERIC DEFAULT 20,
ADD COLUMN IF NOT EXISTS package_discounts JSONB DEFAULT '{"fiveLessons": 5, "tenLessons": 10, "twentyLessons": 15}'::jsonb,
ADD COLUMN IF NOT EXISTS payout_settings JSONB DEFAULT '{"method": "STRIPE", "currency": "USD", "schedule": "WEEKLY", "minThreshold": 50, "accountDetails": "stripe_acct_demo"}'::jsonb,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"emailLessonBooked": true, "emailMessages": true, "emailReviews": true, "smsReminders": true}'::jsonb,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"hideFromSearch": false, "anonymousReviews": false}'::jsonb,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- 2. Stored Procedure: get_tutor_settings_360
CREATE OR REPLACE FUNCTION public.get_tutor_settings_360(p_tutor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prof RECORD;
    v_user RECORD;
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

    SELECT jsonb_build_object(
        'tutorId', v_prof.id,
        'userId', v_prof.user_id,
        'slug', v_prof.slug,
        'hourlyRate', COALESCE(v_prof.hourly_rate, 40),
        'currency', COALESCE(v_prof.currency, 'USD'),
        'trialLessonEnabled', COALESCE(v_prof.trial_lesson_enabled, true),
        'trialLessonPrice', COALESCE(v_prof.trial_lesson_price, 20),
        'packageDiscounts', COALESCE(v_prof.package_discounts, '{"fiveLessons": 5, "tenLessons": 10, "twentyLessons": 15}'::jsonb),
        'payoutSettings', COALESCE(v_prof.payout_settings, '{"method": "STRIPE", "currency": "USD", "schedule": "WEEKLY", "minThreshold": 50, "accountDetails": "stripe_acct_demo"}'::jsonb),
        'notificationPreferences', COALESCE(v_prof.notification_preferences, '{"emailLessonBooked": true, "emailMessages": true, "emailReviews": true, "smsReminders": true}'::jsonb),
        'privacySettings', COALESCE(v_prof.privacy_settings, '{"hideFromSearch": false, "anonymousReviews": false}'::jsonb),
        'accountStatus', COALESCE(v_prof.account_status, 'ACTIVE'),
        'deactivatedAt', v_prof.deactivated_at,
        'deactivationReason', v_prof.deactivation_reason,
        'deletedAt', v_prof.deleted_at,
        'user', jsonb_build_object(
            'id', v_user.id,
            'email', v_user.email,
            'displayName', v_user.display_name,
            'avatarUrl', v_user.avatar_url,
            'country', v_user.country,
            'timezone', v_user.timezone,
            'memberSince', v_user.created_at
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- 3. Stored Procedure: update_tutor_settings_atomic
CREATE OR REPLACE FUNCTION public.update_tutor_settings_atomic(
    p_tutor_id UUID,
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.tutor_profiles
    SET 
        hourly_rate = COALESCE((p_payload->>'hourlyRate')::NUMERIC, hourly_rate),
        currency = COALESCE(p_payload->>'currency', currency),
        trial_lesson_enabled = COALESCE((p_payload->>'trialLessonEnabled')::BOOLEAN, trial_lesson_enabled),
        trial_lesson_price = COALESCE((p_payload->>'trialLessonPrice')::NUMERIC, trial_lesson_price),
        package_discounts = COALESCE(p_payload->'packageDiscounts', package_discounts),
        payout_settings = COALESCE(p_payload->'payoutSettings', payout_settings),
        notification_preferences = COALESCE(p_payload->'notificationPreferences', notification_preferences),
        privacy_settings = COALESCE(p_payload->'privacySettings', privacy_settings),
        updated_at = now()
    WHERE id = p_tutor_id;

    RETURN public.get_tutor_settings_360(p_tutor_id);
END;
$$;

-- 4. Stored Procedure: deactivate_tutor_account
CREATE OR REPLACE FUNCTION public.deactivate_tutor_account(
    p_tutor_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
BEGIN
    SELECT tp.user_id, u.display_name INTO v_user_id, v_user_name
    FROM public.tutor_profiles tp
    JOIN public.users u ON u.id = tp.user_id
    WHERE tp.id = p_tutor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tutor profile not found';
    END IF;

    UPDATE public.tutor_profiles
    SET 
        account_status = 'DEACTIVATED',
        deactivated_at = now(),
        deactivation_reason = p_reason,
        updated_at = now()
    WHERE id = p_tutor_id;

    -- Audit Log
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
        v_user_name,
        'TUTOR',
        'TUTOR_ACCOUNT_DEACTIVATED',
        'TUTOR_PROFILE',
        p_tutor_id,
        'Tutor deactivated account. Reason: ' || COALESCE(p_reason, 'No reason specified')
    );

    RETURN public.get_tutor_settings_360(p_tutor_id);
END;
$$;

-- 5. Stored Procedure: delete_tutor_account_gdpr (Right to Erasure)
CREATE OR REPLACE FUNCTION public.delete_tutor_account_gdpr(
    p_tutor_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
BEGIN
    SELECT tp.user_id, u.display_name INTO v_user_id, v_user_name
    FROM public.tutor_profiles tp
    JOIN public.users u ON u.id = tp.user_id
    WHERE tp.id = p_tutor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tutor profile not found';
    END IF;

    -- 1. Anonymize user identity
    UPDATE public.users
    SET 
        display_name = 'Deleted Tutor #' || substr(v_user_id::text, 1, 8),
        email = 'deleted_' || v_user_id || '@anonymized.sabina.internal',
        avatar_url = NULL,
        phone = NULL,
        updated_at = now()
    WHERE id = v_user_id;

    -- 2. Anonymize and mark tutor profile deleted
    UPDATE public.tutor_profiles
    SET 
        account_status = 'DELETED',
        deleted_at = now(),
        deactivation_reason = p_reason,
        headline = 'Account Permanently Deleted',
        bio = 'This tutor account has been erased in compliance with GDPR / CCPA right to erasure.',
        intro_video_url = NULL,
        video_thumbnail = NULL,
        updated_at = now()
    WHERE id = p_tutor_id;

    -- 3. Record compliance audit log
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
        'GDPR Compliance Engine',
        'SYSTEM',
        'GDPR_ACCOUNT_DELETED',
        'TUTOR_PROFILE',
        p_tutor_id,
        'Account permanently erased and personal data anonymized under GDPR. Reason: ' || COALESCE(p_reason, 'User initiated deletion')
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Account has been permanently deleted and personal data erased.'
    );
END;
$$;

-- 6. Stored Procedure: export_tutor_gdpr_data (Right to Access)
CREATE OR REPLACE FUNCTION public.export_tutor_gdpr_data(p_tutor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prof RECORD;
    v_user RECORD;
    v_educations JSONB;
    v_certifications JSONB;
    v_experiences JSONB;
    v_lessons JSONB;
    v_reviews JSONB;
    result JSONB;
BEGIN
    SELECT * INTO v_prof FROM public.tutor_profiles WHERE id = p_tutor_id;

    IF v_prof IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT id, email, display_name, avatar_url, country, timezone, created_at, updated_at
    INTO v_user
    FROM public.users
    WHERE id = v_prof.user_id;

    SELECT COALESCE(jsonb_agg(row_to_json(e)), '[]'::jsonb) INTO v_educations FROM public.tutor_educations e WHERE tutor_id = p_tutor_id;
    SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb) INTO v_certifications FROM public.tutor_certifications c WHERE tutor_id = p_tutor_id;
    SELECT COALESCE(jsonb_agg(row_to_json(exp)), '[]'::jsonb) INTO v_experiences FROM public.tutor_experiences exp WHERE tutor_id = p_tutor_id;
    SELECT COALESCE(jsonb_agg(row_to_json(l)), '[]'::jsonb) INTO v_lessons FROM public.lessons l WHERE tutor_id = p_tutor_id;
    SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb) INTO v_reviews FROM public.lesson_reviews r WHERE tutor_id = p_tutor_id;

    SELECT jsonb_build_object(
        'gdprExportVersion', '1.0',
        'exportedAt', now(),
        'userProfile', row_to_json(v_user),
        'tutorProfile', row_to_json(v_prof),
        'educations', v_educations,
        'certifications', v_certifications,
        'experiences', v_experiences,
        'lessonsHistory', v_lessons,
        'reviewsReceived', v_reviews
    ) INTO result;

    RETURN result;
END;
$$;
