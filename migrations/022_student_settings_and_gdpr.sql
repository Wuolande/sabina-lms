-- ====================================================================
-- MIGRATION 022: Student Settings, Preferences & GDPR Governance
-- ====================================================================

-- 1. Add settings & GDPR columns to student_profiles
ALTER TABLE public.student_profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "inApp": true, "reminders": true, "marketing": false}'::jsonb,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"showProfileInLeaderboards": true, "shareGoalsWithTutors": true}'::jsonb,
ADD COLUMN IF NOT EXISTS learning_style_notes TEXT,
ADD COLUMN IF NOT EXISTS homework_preference TEXT DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Stored Procedure: get_student_settings_360
CREATE OR REPLACE FUNCTION public.get_student_settings_360(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_prof RECORD;
    result JSONB;
BEGIN
    SELECT id, email, display_name, first_name, last_name, avatar_url, phone, country, timezone, preferred_language, status, created_at
    INTO v_user
    FROM public.users
    WHERE id = p_student_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT * INTO v_prof
    FROM public.student_profiles
    WHERE user_id = p_student_id;

    SELECT jsonb_build_object(
        'user', jsonb_build_object(
            'id', v_user.id,
            'email', v_user.email,
            'displayName', v_user.display_name,
            'firstName', COALESCE(v_user.first_name, split_part(v_user.display_name, ' ', 1)),
            'lastName', COALESCE(v_user.last_name, substr(v_user.display_name, length(split_part(v_user.display_name, ' ', 1)) + 2)),
            'avatarUrl', v_user.avatar_url,
            'phone', COALESCE(v_user.phone, '+1 (555) 987-6543'),
            'country', COALESCE(v_user.country, 'United States'),
            'timezone', COALESCE(v_user.timezone, 'America/New_York'),
            'preferredLanguage', COALESCE(v_user.preferred_language, 'English'),
            'status', v_user.status,
            'createdAt', v_user.created_at
        ),
        'learningPreferences', jsonb_build_object(
            'targetExam', COALESCE(v_prof.target_exam, 'IELTS 7.5+ & Advanced Math'),
            'currentLevel', COALESCE(v_prof.current_level, 'Intermediate'),
            'weeklyStudyHoursTarget', COALESCE(v_prof.weekly_study_hours_target, 6),
            'homeworkPreference', COALESCE(v_prof.homework_preference, 'moderate'),
            'learningStyleNotes', COALESCE(v_prof.learning_style_notes, '')
        ),
        'notificationPreferences', COALESCE(v_prof.notification_preferences, '{"email": true, "sms": false, "inApp": true, "reminders": true, "marketing": false}'::jsonb),
        'privacySettings', COALESCE(v_prof.privacy_settings, '{"showProfileInLeaderboards": true, "shareGoalsWithTutors": true}'::jsonb),
        'accountStatus', COALESCE(v_prof.account_status, 'ACTIVE'),
        'billingProfile', jsonb_build_object(
            'billingName', COALESCE(v_prof.billing_name, v_user.display_name),
            'billingEmail', COALESCE(v_prof.billing_email, v_user.email),
            'taxId', COALESCE(v_prof.tax_id, ''),
            'addressLine1', COALESCE(v_prof.address_line1, '742 Evergreen Terrace'),
            'city', COALESCE(v_prof.city, 'Springfield'),
            'postalCode', COALESCE(v_prof.postal_code, '97477'),
            'country', COALESCE(v_prof.billing_country, v_user.country, 'United States')
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- 3. Stored Procedure: update_student_settings_atomic
CREATE OR REPLACE FUNCTION public.update_student_settings_atomic(
    p_student_id UUID,
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_updates JSONB := p_payload->'user';
    v_pref_updates JSONB := p_payload->'learningPreferences';
    v_notif_updates JSONB := p_payload->'notificationPreferences';
    v_priv_updates JSONB := p_payload->'privacySettings';
BEGIN
    -- Update users table
    IF v_user_updates IS NOT NULL THEN
        UPDATE public.users
        SET
            display_name = COALESCE((v_user_updates->>'displayName'), display_name),
            first_name = COALESCE((v_user_updates->>'firstName'), first_name),
            last_name = COALESCE((v_user_updates->>'lastName'), last_name),
            avatar_url = COALESCE((v_user_updates->>'avatarUrl'), avatar_url),
            phone = COALESCE((v_user_updates->>'phone'), phone),
            country = COALESCE((v_user_updates->>'country'), country),
            timezone = COALESCE((v_user_updates->>'timezone'), timezone),
            preferred_language = COALESCE((v_user_updates->>'preferredLanguage'), preferred_language),
            updated_at = now()
        WHERE id = p_student_id;
    END IF;

    -- Update student_profiles
    UPDATE public.student_profiles
    SET
        target_exam = CASE WHEN v_pref_updates ? 'targetExam' THEN (v_pref_updates->>'targetExam') ELSE target_exam END,
        current_level = CASE WHEN v_pref_updates ? 'currentLevel' THEN (v_pref_updates->>'currentLevel') ELSE current_level END,
        weekly_study_hours_target = CASE WHEN v_pref_updates ? 'weeklyStudyHoursTarget' THEN (v_pref_updates->>'weeklyStudyHoursTarget')::int ELSE weekly_study_hours_target END,
        homework_preference = CASE WHEN v_pref_updates ? 'homeworkPreference' THEN (v_pref_updates->>'homeworkPreference') ELSE homework_preference END,
        learning_style_notes = CASE WHEN v_pref_updates ? 'learningStyleNotes' THEN (v_pref_updates->>'learningStyleNotes') ELSE learning_style_notes END,
        notification_preferences = CASE WHEN v_notif_updates IS NOT NULL THEN v_notif_updates ELSE notification_preferences END,
        privacy_settings = CASE WHEN v_priv_updates IS NOT NULL THEN v_priv_updates ELSE privacy_settings END,
        updated_at = now()
    WHERE user_id = p_student_id;

    RETURN public.get_student_settings_360(p_student_id);
END;
$$;

-- 4. Stored Procedure: deactivate_student_account
CREATE OR REPLACE FUNCTION public.deactivate_student_account(
    p_student_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.student_profiles
    SET
        account_status = 'DEACTIVATED',
        deactivated_at = now(),
        deactivation_reason = p_reason,
        updated_at = now()
    WHERE user_id = p_student_id;

    UPDATE public.users
    SET status = 'INACTIVE', updated_at = now()
    WHERE id = p_student_id;

    RETURN public.get_student_settings_360(p_student_id);
END;
$$;

-- 5. Stored Procedure: delete_student_account_gdpr
CREATE OR REPLACE FUNCTION public.delete_student_account_gdpr(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mark profile as deleted & anonymize
    UPDATE public.student_profiles
    SET
        account_status = 'DELETED',
        deleted_at = now(),
        billing_name = 'Deleted Student',
        billing_email = 'deleted@sabinaedge.com',
        tax_id = NULL,
        address_line1 = NULL,
        city = NULL,
        postal_code = NULL,
        learning_style_notes = NULL,
        updated_at = now()
    WHERE user_id = p_student_id;

    -- Anonymize user record
    UPDATE public.users
    SET
        display_name = 'Deleted Student',
        first_name = 'Deleted',
        last_name = 'Student',
        email = 'deleted_' || substr(p_student_id::text, 1, 8) || '@deleted.sabinaedge.com',
        phone = NULL,
        avatar_url = NULL,
        status = 'SUSPENDED',
        updated_at = now()
    WHERE id = p_student_id;

    -- Remove saved payment methods
    DELETE FROM public.student_payment_methods WHERE student_id = p_student_id;

    RETURN true;
END;
$$;

-- 6. Stored Procedure: export_student_gdpr_data
CREATE OR REPLACE FUNCTION public.export_student_gdpr_data(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user JSONB;
    v_profile JSONB;
    v_lessons JSONB;
    v_goals JSONB;
    v_invoices JSONB;
    result JSONB;
BEGIN
    SELECT to_jsonb(u) INTO v_user FROM public.users u WHERE u.id = p_student_id;
    SELECT to_jsonb(sp) INTO v_profile FROM public.student_profiles sp WHERE sp.user_id = p_student_id;
    SELECT public.get_student_lessons_list(p_student_id) INTO v_lessons;
    SELECT COALESCE(jsonb_agg(to_jsonb(g)), '[]'::jsonb) INTO v_goals FROM public.student_learning_goals g WHERE g.student_id = p_student_id;
    SELECT (public.get_student_billing_360(p_student_id)->'invoices') INTO v_invoices;

    SELECT jsonb_build_object(
        'exportedAt', now(),
        'gdprNotice', 'Official GDPR Data Portability Export from Sabina LMS Education Platform',
        'account', v_user,
        'studentProfile', v_profile,
        'learningGoals', v_goals,
        'lessonHistory', v_lessons,
        'billingAndInvoices', v_invoices
    ) INTO result;

    RETURN result;
END;
$$;
