-- ====================================================================
-- MIGRATION 006: Auth Integration, RLS Policies & PostgreSQL Functions
-- ====================================================================
-- Purpose: Enables Row Level Security (RLS) across all application tables,
-- connects public.users with auth.users, and defines PostgreSQL functions
-- for single-roundtrip Tutor 360 aggregation and atomic tutor provisioning.
--
-- Migration notes:
--  - Idempotent script: safe to re-run on any Supabase instance.
--  - All policies and functions use SECURITY DEFINER where appropriate.
-- ====================================================================

-- Section A: Link public.users to auth.users
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- Section B: User Sessions Table (for tracking active admin sessions)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- Section C: Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_application_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_application_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_application_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_application_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_assets ENABLE ROW LEVEL SECURITY;

-- Section D: Helper function to get the current user's app user_id
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE SQL STABLE
SECURITY DEFINER
AS $$
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- Section E: Helper function to get the current user's roles
CREATE OR REPLACE FUNCTION public.get_current_user_roles()
RETURNS TEXT[]
LANGUAGE SQL STABLE
SECURITY DEFINER
AS $$
    SELECT ARRAY_AGG(role_id)
    FROM public.user_roles
    WHERE user_id = public.get_current_user_id();
$$;

-- Section F: RLS Policies for users table
-- Users can read their own profile
DROP POLICY IF EXISTS users_self_read ON public.users;
CREATE POLICY users_self_read ON public.users
    FOR SELECT USING (auth_id = auth.uid());

-- Section G: RLS Policies for tutor_applications
-- Tutors can read/write their own applications
DROP POLICY IF EXISTS tutor_apps_own_read ON public.tutor_applications;
CREATE POLICY tutor_apps_own_read ON public.tutor_applications
    FOR SELECT USING (applicant_user_id = public.get_current_user_id());

DROP POLICY IF EXISTS tutor_apps_own_insert ON public.tutor_applications;
CREATE POLICY tutor_apps_own_insert ON public.tutor_applications
    FOR INSERT WITH CHECK (applicant_user_id = public.get_current_user_id());

DROP POLICY IF EXISTS tutor_apps_own_update ON public.tutor_applications;
CREATE POLICY tutor_apps_own_update ON public.tutor_applications
    FOR UPDATE USING (applicant_user_id = public.get_current_user_id());

-- Section H: RLS Policy for audit_logs - INSERT ONLY (no updates/deletes)
DROP POLICY IF EXISTS audit_logs_insert_only ON public.audit_logs;
CREATE POLICY audit_logs_insert_only ON public.audit_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS audit_logs_read_own ON public.audit_logs;
CREATE POLICY audit_logs_read_own ON public.audit_logs
    FOR SELECT USING (
        actor_user_id = public.get_current_user_id()
        OR 'SUPER_ADMIN' = ANY(public.get_current_user_roles())
        OR 'ADMIN' = ANY(public.get_current_user_roles())
    );

-- Section I: RLS for tutor_profiles - tutors can read own, public can read active
DROP POLICY IF EXISTS tutor_profiles_public_read ON public.tutor_profiles;
CREATE POLICY tutor_profiles_public_read ON public.tutor_profiles
    FOR SELECT USING (account_status = 'ACTIVE');

DROP POLICY IF EXISTS tutor_profiles_own_read ON public.tutor_profiles;
CREATE POLICY tutor_profiles_own_read ON public.tutor_profiles
    FOR SELECT USING (user_id = public.get_current_user_id());

-- Section J: Automatic updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tutor_profiles_updated_at ON public.tutor_profiles;
CREATE TRIGGER trg_tutor_profiles_updated_at
    BEFORE UPDATE ON public.tutor_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tutor_applications_updated_at ON public.tutor_applications;
CREATE TRIGGER trg_tutor_applications_updated_at
    BEFORE UPDATE ON public.tutor_applications
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Section K: PostgreSQL function to get full Tutor 360 Aggregate in one query
CREATE OR REPLACE FUNCTION public.get_tutor_360_aggregate(p_tutor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', tp.id,
        'userId', tp.user_id,
        'slug', tp.slug,
        'headline', tp.headline,
        'bio', tp.bio,
        'hourlyRate', tp.hourly_rate,
        'currency', tp.currency,
        'yearsExperience', tp.years_experience,
        'teachingStyle', tp.teaching_style,
        'introVideoUrl', tp.intro_video_url,
        'averageRating', tp.average_rating,
        'reviewCount', tp.review_count,
        'totalLessons', tp.total_lessons,
        'totalStudents', tp.total_students,
        'accountStatus', tp.account_status,
        'verificationStatus', tp.verification_status,
        'suspensionReason', tp.suspension_reason,
        'suspendedAt', tp.suspended_at,
        'isSuperTutor', tp.is_super_tutor,
        'isFeatured', tp.is_featured,
        'responseTimeMinutes', tp.response_time_minutes,
        'attendanceRate', tp.attendance_rate,
        'repeatStudentRate', tp.repeat_student_rate,
        'createdAt', tp.created_at,
        'applicationId', tp.application_id,
        'user', jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'firstName', u.first_name,
            'lastName', u.last_name,
            'displayName', u.display_name,
            'avatarUrl', u.avatar_url,
            'phone', u.phone,
            'country', u.country,
            'timezone', u.timezone,
            'status', u.status,
            'createdAt', u.created_at
        ),
        'subjects', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', ts.id,
                'subjectId', ts.subject_id,
                'name', s.name,
                'category', s.category,
                'levels', ts.levels,
                'isPrimary', ts.is_primary
            ) ORDER BY ts.is_primary DESC, s.name)
            FROM public.tutor_subjects ts
            JOIN public.subjects s ON s.id = ts.subject_id
            WHERE ts.tutor_id = tp.id
        ), '[]'::jsonb),
        'languages', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', tl.id,
                'languageId', tl.language_id,
                'name', l.name,
                'code', l.code,
                'proficiency', tl.proficiency
            ))
            FROM public.tutor_languages tl
            JOIN public.languages l ON l.id = tl.language_id
            WHERE tl.tutor_id = tp.id
        ), '[]'::jsonb),
        'education', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', te.id,
                'degree', te.degree,
                'institution', te.institution,
                'fieldOfStudy', te.field_of_study,
                'startYear', te.start_year,
                'endYear', te.end_year,
                'honors', te.honors,
                'isVerified', te.is_verified
            ) ORDER BY te.start_year DESC)
            FROM public.tutor_educations te
            WHERE te.tutor_id = tp.id
        ), '[]'::jsonb),
        'certifications', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', tc.id,
                'title', tc.title,
                'issuer', tc.issuer,
                'issueYear', tc.issue_year,
                'credentialId', tc.credential_id,
                'certificateUrl', tc.certificate_url,
                'isVerified', tc.is_verified
            ) ORDER BY tc.issue_year DESC)
            FROM public.tutor_certifications tc
            WHERE tc.tutor_id = tp.id
        ), '[]'::jsonb),
        'experiences', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', tex.id,
                'role', tex.role,
                'organization', tex.organization,
                'location', tex.location,
                'startYear', tex.start_year,
                'endYear', tex.end_year,
                'description', tex.description,
                'period', CONCAT(tex.start_year, ' - ', COALESCE(tex.end_year::TEXT, 'Present'))
            ) ORDER BY tex.start_year DESC)
            FROM public.tutor_experiences tex
            WHERE tex.tutor_id = tp.id
        ), '[]'::jsonb),
        'auditTrail', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', al.id,
                'action', al.action,
                'actorName', al.actor_name,
                'actorRole', al.actor_role,
                'details', al.details,
                'beforeState', al.before_state,
                'afterState', al.after_state,
                'ipAddress', al.ip_address,
                'createdAt', al.created_at
            ) ORDER BY al.created_at DESC)
            FROM public.audit_logs al
            WHERE al.entity_type = 'TUTOR_PROFILE'
            AND al.entity_id = tp.id::TEXT
        ), '[]'::jsonb)
    )
    INTO result
    FROM public.tutor_profiles tp
    JOIN public.users u ON u.id = tp.user_id
    WHERE tp.id = p_tutor_id;

    RETURN result;
END;
$$;

-- Section L: Atomic provision tutor from application
CREATE OR REPLACE FUNCTION public.provision_tutor_from_application(
    p_application_id UUID,
    p_admin_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_app public.tutor_applications%ROWTYPE;
    v_user public.users%ROWTYPE;
    v_tutor_id UUID;
    v_slug TEXT;
    v_existing_tutor_id UUID;
BEGIN
    -- Fetch the application
    SELECT * INTO v_app FROM public.tutor_applications WHERE id = p_application_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found: %', p_application_id;
    END IF;

    -- Fetch the applicant user
    SELECT * INTO v_user FROM public.users WHERE id = v_app.applicant_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Applicant user not found: %', v_app.applicant_user_id;
    END IF;

    -- Check if tutor profile already exists for this user
    SELECT id INTO v_existing_tutor_id FROM public.tutor_profiles WHERE user_id = v_app.applicant_user_id;
    IF FOUND THEN
        -- Update application_id link and return existing
        UPDATE public.tutor_profiles
        SET application_id = p_application_id,
            account_status = 'ACTIVE',
            verification_status = 'APPROVED',
            updated_at = NOW()
        WHERE id = v_existing_tutor_id;
        RETURN v_existing_tutor_id;
    END IF;

    -- Generate unique slug from display_name
    v_slug := LOWER(REGEXP_REPLACE(v_user.display_name, '[^a-zA-Z0-9]+', '-', 'g'));
    IF EXISTS (SELECT 1 FROM public.tutor_profiles WHERE slug = v_slug) THEN
        v_slug := v_slug || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 6);
    END IF;

    -- Create the tutor profile
    INSERT INTO public.tutor_profiles (
        user_id, application_id, slug, headline, bio,
        hourly_rate, currency, years_experience, teaching_style,
        intro_video_url, verification_status, account_status,
        is_featured, is_super_tutor
    ) VALUES (
        v_app.applicant_user_id,
        p_application_id,
        v_slug,
        COALESCE(v_app.headline, 'Expert Online Tutor'),
        COALESCE(v_app.bio, ''),
        COALESCE(v_app.hourly_rate, 25.00),
        COALESCE(v_app.currency, 'USD'),
        COALESCE(v_app.years_experience, 0),
        v_app.teaching_style,
        v_app.intro_video_url,
        'APPROVED',
        'ACTIVE',
        false,
        false
    ) RETURNING id INTO v_tutor_id;

    -- Copy education from application
    INSERT INTO public.tutor_educations (tutor_id, degree, institution, field_of_study, start_year, end_year, honors, is_verified)
    SELECT v_tutor_id, degree, institution, field_of_study, start_year, end_year, honors, is_verified
    FROM public.tutor_application_education
    WHERE application_id = p_application_id;

    -- Copy experience from application
    INSERT INTO public.tutor_experiences (tutor_id, role, organization, location, start_year, end_year, description)
    SELECT v_tutor_id, role, organization, location, start_year, end_year, description
    FROM public.tutor_application_experience
    WHERE application_id = p_application_id;

    -- Copy subjects from application
    INSERT INTO public.tutor_subjects (tutor_id, subject_id, levels, is_primary)
    SELECT v_tutor_id, subject_id, levels, is_primary
    FROM public.tutor_application_subjects
    WHERE application_id = p_application_id
    ON CONFLICT (tutor_id, subject_id) DO NOTHING;

    -- Copy languages from application
    INSERT INTO public.tutor_languages (tutor_id, language_id, proficiency)
    SELECT v_tutor_id, language_id, proficiency
    FROM public.tutor_application_languages
    WHERE application_id = p_application_id
    ON CONFLICT (tutor_id, language_id) DO NOTHING;

    -- Assign TUTOR role to user
    INSERT INTO public.user_roles (user_id, role_id, assigned_by)
    VALUES (v_app.applicant_user_id, 'TUTOR', p_admin_id)
    ON CONFLICT DO NOTHING;

    RETURN v_tutor_id;
END;
$$;
