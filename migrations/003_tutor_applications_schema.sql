-- ====================================================================
-- MIGRATION 003: Subjects, Languages & Tutor Applications Schema
-- ====================================================================

-- 1. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    slug VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL, -- e.g. 'Languages', 'STEM', 'Exam Prep'
    description TEXT,
    icon_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Languages Table
CREATE TABLE IF NOT EXISTS public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE, -- ISO 639-1
    native_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tutor Applications Table
CREATE TABLE IF NOT EXISTS public.tutor_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' 
        CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REQUESTED_CHANGES', 'RESUBMITTED', 'REJECTED', 'APPROVED', 'ONBOARDING', 'ACTIVE')),
    headline VARCHAR(200),
    bio TEXT,
    years_experience INT DEFAULT 0 CHECK (years_experience >= 0),
    hourly_rate NUMERIC(10,2) DEFAULT 0.00 CHECK (hourly_rate >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    teaching_style TEXT,
    intro_video_url TEXT,
    reviewer_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    requested_changes TEXT,
    approval_notes TEXT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tutor Application Documents
CREATE TABLE IF NOT EXISTS public.tutor_application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.tutor_applications(id) ON DELETE CASCADE,
    file_asset_id UUID REFERENCES public.file_assets(id) ON DELETE SET NULL,
    document_type VARCHAR(50) NOT NULL -- 'IDENTITY', 'DEGREE_CERTIFICATE', 'TEACHING_CREDENTIAL', 'RESUME', 'OTHER'
        CHECK (document_type IN ('IDENTITY', 'DEGREE_CERTIFICATE', 'TEACHING_CREDENTIAL', 'RESUME', 'OTHER')),
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tutor Application Education
CREATE TABLE IF NOT EXISTS public.tutor_application_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.tutor_applications(id) ON DELETE CASCADE,
    degree VARCHAR(150) NOT NULL,
    institution VARCHAR(200) NOT NULL,
    field_of_study VARCHAR(150),
    start_year INT NOT NULL,
    end_year INT,
    honors VARCHAR(150),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tutor Application Experience
CREATE TABLE IF NOT EXISTS public.tutor_application_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.tutor_applications(id) ON DELETE CASCADE,
    role VARCHAR(150) NOT NULL,
    organization VARCHAR(200) NOT NULL,
    location VARCHAR(150),
    start_year INT NOT NULL,
    end_year INT,
    is_current BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Tutor Application Subjects
CREATE TABLE IF NOT EXISTS public.tutor_application_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.tutor_applications(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    levels TEXT[] DEFAULT '{}', -- e.g. ARRAY['Beginner', 'Intermediate', 'Advanced']
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Tutor Application Languages
CREATE TABLE IF NOT EXISTS public.tutor_application_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.tutor_applications(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    proficiency VARCHAR(50) NOT NULL DEFAULT 'PROFESSIONAL'
        CHECK (proficiency IN ('NATIVE', 'FLUENT', 'PROFESSIONAL', 'INTERMEDIATE', 'BASIC')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Application Review Logs
CREATE TABLE IF NOT EXISTS public.tutor_application_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.tutor_applications(id) ON DELETE CASCADE,
    reviewer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tutor_apps_status ON public.tutor_applications(status);
CREATE INDEX IF NOT EXISTS idx_tutor_apps_applicant ON public.tutor_applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_apps_reviewer ON public.tutor_applications(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_apps_submitted ON public.tutor_applications(submitted_at);
