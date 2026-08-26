-- ====================================================================
-- MIGRATION 008: Student Profiles, Learning Goals & User 360 System
-- ====================================================================
-- Purpose: Creates student profiles, learning goals tracking, favorite
-- tutors, cross-panel tutor enrollments, and aggregate PostgreSQL functions
-- for both student learning dashboard and admin global User 360 inspection.
-- ====================================================================

-- 1. Student Profiles Table
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    target_exam VARCHAR(100),
    current_level VARCHAR(50) DEFAULT 'Intermediate',
    weekly_study_hours_target INT DEFAULT 5,
    total_hours_learned NUMERIC(6,1) DEFAULT 0.0,
    completed_lessons INT DEFAULT 0,
    active_subjects_count INT DEFAULT 0,
    learning_streak_days INT DEFAULT 0,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON public.student_profiles(user_id);

-- 2. Student Learning Goals Table
CREATE TABLE IF NOT EXISTS public.student_learning_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_name VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    progress_percent INT DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    status VARCHAR(50) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'PAUSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_goals_student ON public.student_learning_goals(student_id);

-- 3. Student Favorite Tutors Table
CREATE TABLE IF NOT EXISTS public.student_favorite_tutors (
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tutor_profile_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, tutor_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_student_favs_student ON public.student_favorite_tutors(student_id);
CREATE INDEX IF NOT EXISTS idx_student_favs_tutor ON public.student_favorite_tutors(tutor_profile_id);

-- 4. Student Tutor Enrollments Table (Cross-panel link between tutors & students)
CREATE TABLE IF NOT EXISTS public.student_tutor_enrollments (
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    total_lessons_together INT DEFAULT 0,
    total_hours_together NUMERIC(6,1) DEFAULT 0.0,
    first_lesson_at TIMESTAMPTZ,
    last_lesson_at TIMESTAMPTZ,
    private_tutor_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, tutor_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.student_tutor_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_tutor ON public.student_tutor_enrollments(tutor_id);

-- 5. Automatic updated_at triggers
DROP TRIGGER IF EXISTS trg_student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER trg_student_profiles_updated_at
    BEFORE UPDATE ON public.student_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_student_learning_goals_updated_at ON public.student_learning_goals;
CREATE TRIGGER trg_student_learning_goals_updated_at
    BEFORE UPDATE ON public.student_learning_goals
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_student_tutor_enrollments_updated_at ON public.student_tutor_enrollments;
CREATE TRIGGER trg_student_tutor_enrollments_updated_at
    BEFORE UPDATE ON public.student_tutor_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Enable RLS on new tables
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_favorite_tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tutor_enrollments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
DROP POLICY IF EXISTS student_profiles_all ON public.student_profiles;
CREATE POLICY student_profiles_all ON public.student_profiles FOR ALL USING (true);

DROP POLICY IF EXISTS student_goals_all ON public.student_learning_goals;
CREATE POLICY student_goals_all ON public.student_learning_goals FOR ALL USING (true);

DROP POLICY IF EXISTS student_favs_all ON public.student_favorite_tutors;
CREATE POLICY student_favs_all ON public.student_favorite_tutors FOR ALL USING (true);

DROP POLICY IF EXISTS student_enrollments_all ON public.student_tutor_enrollments;
CREATE POLICY student_enrollments_all ON public.student_tutor_enrollments FOR ALL USING (true);

-- 8. Stored Procedure: get_student_360_aggregate
CREATE OR REPLACE FUNCTION public.get_student_360_aggregate(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'firstName', u.first_name,
        'lastName', u.last_name,
        'displayName', u.display_name,
        'avatarUrl', u.avatar_url,
        'phone', u.phone,
        'country', u.country,
        'timezone', u.timezone,
        'preferredLanguage', u.preferred_language,
        'status', u.status,
        'createdAt', u.created_at,
        'profile', (
            SELECT jsonb_build_object(
                'id', sp.id,
                'targetExam', sp.target_exam,
                'currentLevel', sp.current_level,
                'weeklyStudyHoursTarget', sp.weekly_study_hours_target,
                'totalHoursLearned', sp.total_hours_learned,
                'completedLessons', sp.completed_lessons,
                'activeSubjectsCount', sp.active_subjects_count,
                'learningStreakDays', sp.learning_streak_days,
                'lastActiveAt', sp.last_active_at
            )
            FROM public.student_profiles sp
            WHERE sp.user_id = u.id
            LIMIT 1
        ),
        'goals', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', slg.id,
                'subjectId', slg.subject_id,
                'subjectName', COALESCE(slg.subject_name, s.name, 'General'),
                'title', slg.title,
                'description', slg.description,
                'targetDate', slg.target_date,
                'progressPercent', slg.progress_percent,
                'status', slg.status,
                'createdAt', slg.created_at
            ) ORDER BY slg.created_at DESC)
            FROM public.student_learning_goals slg
            LEFT JOIN public.subjects s ON s.id = slg.subject_id
            WHERE slg.student_id = u.id
        ), '[]'::jsonb),
        'favoriteTutors', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'tutorProfileId', tp.id,
                'slug', tp.slug,
                'headline', tp.headline,
                'hourlyRate', tp.hourly_rate,
                'currency', tp.currency,
                'averageRating', tp.average_rating,
                'reviewCount', tp.review_count,
                'isFeatured', tp.is_featured,
                'isSuperTutor', tp.is_super_tutor,
                'tutorName', tu.display_name,
                'tutorAvatar', tu.avatar_url,
                'tutorCountry', tu.country
            ))
            FROM public.student_favorite_tutors sft
            JOIN public.tutor_profiles tp ON tp.id = sft.tutor_profile_id
            JOIN public.users tu ON tu.id = tp.user_id
            WHERE sft.student_id = u.id
        ), '[]'::jsonb),
        'enrolledTutors', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'tutorProfileId', tp.id,
                'tutorName', tu.display_name,
                'tutorAvatar', tu.avatar_url,
                'headline', tp.headline,
                'totalLessonsTogether', ste.total_lessons_together,
                'totalHoursTogether', ste.total_hours_together,
                'lastLessonAt', ste.last_lesson_at,
                'privateTutorNotes', ste.private_tutor_notes
            ))
            FROM public.student_tutor_enrollments ste
            JOIN public.tutor_profiles tp ON tp.id = ste.tutor_id
            JOIN public.users tu ON tu.id = tp.user_id
            WHERE ste.student_id = u.id
        ), '[]'::jsonb)
    )
    INTO result
    FROM public.users u
    WHERE u.id = p_student_id;

    RETURN result;
END;
$$;

-- 9. Stored Procedure: get_user_360_aggregate (Global Admin View for Any User)
CREATE OR REPLACE FUNCTION public.get_user_360_aggregate(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', u.id,
        'authId', u.auth_id,
        'email', u.email,
        'firstName', u.first_name,
        'lastName', u.last_name,
        'displayName', u.display_name,
        'avatarUrl', u.avatar_url,
        'phone', u.phone,
        'country', u.country,
        'timezone', u.timezone,
        'preferredLanguage', u.preferred_language,
        'status', u.status,
        'createdAt', u.created_at,
        'updatedAt', u.updated_at,
        'roles', COALESCE((
            SELECT jsonb_agg(ur.role_id)
            FROM public.user_roles ur
            WHERE ur.user_id = u.id
        ), '[]'::jsonb),
        'studentProfile', (
            SELECT jsonb_build_object(
                'id', sp.id,
                'targetExam', sp.target_exam,
                'currentLevel', sp.current_level,
                'weeklyStudyHoursTarget', sp.weekly_study_hours_target,
                'totalHoursLearned', sp.total_hours_learned,
                'completedLessons', sp.completed_lessons,
                'activeSubjectsCount', sp.active_subjects_count,
                'learningStreakDays', sp.learning_streak_days,
                'lastActiveAt', sp.last_active_at,
                'goals', COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', slg.id,
                        'title', slg.title,
                        'subjectName', slg.subject_name,
                        'targetDate', slg.target_date,
                        'progressPercent', slg.progress_percent,
                        'status', slg.status
                    ) ORDER BY slg.created_at DESC)
                    FROM public.student_learning_goals slg
                    WHERE slg.student_id = u.id
                ), '[]'::jsonb)
            )
            FROM public.student_profiles sp
            WHERE sp.user_id = u.id
            LIMIT 1
        ),
        'tutorProfile', (
            SELECT jsonb_build_object(
                'id', tp.id,
                'slug', tp.slug,
                'headline', tp.headline,
                'hourlyRate', tp.hourly_rate,
                'currency', tp.currency,
                'averageRating', tp.average_rating,
                'reviewCount', tp.review_count,
                'totalLessons', tp.total_lessons,
                'totalStudents', tp.total_students,
                'accountStatus', tp.account_status,
                'isFeatured', tp.is_featured,
                'isSuperTutor', tp.is_super_tutor
            )
            FROM public.tutor_profiles tp
            WHERE tp.user_id = u.id
            LIMIT 1
        ),
        'auditTrail', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', al.id,
                'action', al.action,
                'actorName', al.actor_name,
                'actorRole', al.actor_role,
                'details', al.details,
                'beforeState', al.before_state,
                'afterState', al.after_state,
                'createdAt', al.created_at
            ) ORDER BY al.created_at DESC)
            FROM public.audit_logs al
            WHERE (al.entity_type = 'USER' AND al.entity_id = u.id::TEXT)
               OR (al.entity_type = 'STUDENT' AND al.entity_id = u.id::TEXT)
        ), '[]'::jsonb)
    )
    INTO result
    FROM public.users u
    WHERE u.id = p_user_id;

    RETURN result;
END;
$$;
