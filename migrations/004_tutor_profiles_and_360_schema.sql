-- ====================================================================
-- MIGRATION 004: Active Tutor Profiles & Tutor 360 Aggregation Schema
-- ====================================================================

-- 1. Active Tutor Profiles
CREATE TABLE IF NOT EXISTS public.tutor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE RESTRICT,
    application_id UUID REFERENCES public.tutor_applications(id) ON DELETE SET NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    headline VARCHAR(200) NOT NULL,
    bio TEXT NOT NULL,
    hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 25.00 CHECK (hourly_rate >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    years_experience INT NOT NULL DEFAULT 0,
    teaching_style TEXT,
    intro_video_url TEXT,
    video_thumbnail TEXT,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'APPROVED'
        CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    account_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
        CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')),
    suspension_reason TEXT,
    suspended_at TIMESTAMPTZ,
    suspended_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    average_rating NUMERIC(3,2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    total_lessons INT DEFAULT 0,
    total_students INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_super_tutor BOOLEAN DEFAULT false,
    response_time_minutes INT DEFAULT 60,
    attendance_rate NUMERIC(5,2) DEFAULT 100.0,
    repeat_student_rate NUMERIC(5,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tutor Active Subjects
CREATE TABLE IF NOT EXISTS public.tutor_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    levels TEXT[] DEFAULT '{}',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tutor_id, subject_id)
);

-- 3. Tutor Active Languages
CREATE TABLE IF NOT EXISTS public.tutor_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    proficiency VARCHAR(50) NOT NULL DEFAULT 'PROFESSIONAL'
        CHECK (proficiency IN ('NATIVE', 'FLUENT', 'PROFESSIONAL', 'INTERMEDIATE', 'BASIC')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tutor_id, language_id)
);

-- 4. Tutor Active Education
CREATE TABLE IF NOT EXISTS public.tutor_educations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    degree VARCHAR(150) NOT NULL,
    institution VARCHAR(200) NOT NULL,
    field_of_study VARCHAR(150),
    start_year INT NOT NULL,
    end_year INT,
    honors VARCHAR(150),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tutor Active Certifications
CREATE TABLE IF NOT EXISTS public.tutor_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    issuer VARCHAR(200) NOT NULL,
    issue_year INT NOT NULL,
    credential_id VARCHAR(150),
    certificate_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tutor Active Experiences
CREATE TABLE IF NOT EXISTS public.tutor_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    role VARCHAR(150) NOT NULL,
    organization VARCHAR(200) NOT NULL,
    location VARCHAR(150),
    start_year INT NOT NULL,
    end_year INT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_tutors_status ON public.tutor_profiles(account_status, verification_status);
CREATE INDEX IF NOT EXISTS idx_tutors_rating ON public.tutor_profiles(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_tutors_hourly_rate ON public.tutor_profiles(hourly_rate);
CREATE INDEX IF NOT EXISTS idx_tutors_slug ON public.tutor_profiles(slug);
