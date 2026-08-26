-- ====================================================================
-- MIGRATION 026: Sabina Tutor Training & Certification Academy Schema
-- ====================================================================

-- 1. Training Courses
CREATE TABLE IF NOT EXISTS public.training_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    headline VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Pedagogy' CHECK (category IN ('Classroom Tools', 'Pedagogy', 'Safeguarding', 'Exam Coaching', 'Business & Growth')),
    level VARCHAR(50) NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
    estimated_minutes INT NOT NULL DEFAULT 45,
    thumbnail_url TEXT,
    badge_title VARCHAR(150) NOT NULL,
    badge_icon VARCHAR(50) NOT NULL DEFAULT 'Award',
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    passing_score_percentage INT NOT NULL DEFAULT 80,
    order_index INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Training Modules / Lessons
CREATE TABLE IF NOT EXISTS public.training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    module_type VARCHAR(50) NOT NULL DEFAULT 'video' CHECK (module_type IN ('video', 'reading', 'interactive', 'quiz')),
    video_url TEXT,
    reading_content TEXT,
    duration_minutes INT NOT NULL DEFAULT 10,
    order_index INT NOT NULL DEFAULT 0,
    resources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Training Quizzes
CREATE TABLE IF NOT EXISTS public.training_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL UNIQUE REFERENCES public.training_courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score INT NOT NULL DEFAULT 80,
    time_limit_minutes INT DEFAULT 20,
    max_attempts INT DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Quiz Questions
CREATE TABLE IF NOT EXISTS public.training_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings e.g. ["Option A", "Option B", "Option C", "Option D"]
    correct_option_index INT NOT NULL,
    explanation TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tutor Course Enrollments & Progress
CREATE TABLE IF NOT EXISTS public.tutor_course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tutor_id, course_id)
);

-- 6. Tutor Module Lesson Progress
CREATE TABLE IF NOT EXISTS public.tutor_module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    watched_seconds INT DEFAULT 0,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tutor_id, module_id)
);

-- 7. Tutor Quiz Attempts
CREATE TABLE IF NOT EXISTS public.tutor_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
    score_percentage INT NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT false,
    submitted_answers JSONB NOT NULL, -- e.g. {"0": 1, "1": 3}
    time_spent_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Tutor Issued Certificates & Badges
CREATE TABLE IF NOT EXISTS public.tutor_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
    certificate_code VARCHAR(100) NOT NULL UNIQUE,
    badge_title VARCHAR(150) NOT NULL,
    badge_icon VARCHAR(50) NOT NULL,
    score_achieved INT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (tutor_id, course_id)
);

-- 9. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_training_modules_course_id ON public.training_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_training_questions_quiz_id ON public.training_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_tutor_enrollments_tutor ON public.tutor_course_enrollments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_certificates_tutor ON public.tutor_certificates(tutor_id);

-- 10. Enable Row Level Security
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_certificates ENABLE ROW LEVEL SECURITY;

-- Allow public read for published courses, modules and public certificates
CREATE POLICY "Public read published courses" ON public.training_courses FOR SELECT USING (is_published = true);
CREATE POLICY "Public read training modules" ON public.training_modules FOR SELECT USING (true);
CREATE POLICY "Public read training quizzes" ON public.training_quizzes FOR SELECT USING (true);
CREATE POLICY "Public read certificates" ON public.tutor_certificates FOR SELECT USING (true);
CREATE POLICY "Tutors manage own enrollments" ON public.tutor_course_enrollments FOR ALL USING (true);
CREATE POLICY "Tutors manage own module progress" ON public.tutor_module_progress FOR ALL USING (true);
CREATE POLICY "Tutors manage quiz attempts" ON public.tutor_quiz_attempts FOR ALL USING (true);
