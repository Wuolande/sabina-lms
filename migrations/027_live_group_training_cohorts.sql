-- ====================================================================
-- MIGRATION 027: Live Group Training Classrooms & Cohort Workshops Schema
-- ====================================================================

-- 1. Live Training Sessions Table
CREATE TABLE IF NOT EXISTS public.training_live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    headline VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    trainer_name VARCHAR(150) NOT NULL,
    trainer_avatar TEXT,
    trainer_role VARCHAR(150) NOT NULL DEFAULT 'Senior Academic Master Trainer',
    category VARCHAR(100) NOT NULL DEFAULT 'Pedagogy' CHECK (category IN ('Classroom Tools', 'Pedagogy', 'Safeguarding', 'Exam Coaching', 'Business & Growth')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    max_attendees INT NOT NULL DEFAULT 100,
    current_attendees INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
    video_room_id VARCHAR(100) NOT NULL,
    stream_url TEXT,
    slides_url TEXT,
    recording_url TEXT,
    attendance_code VARCHAR(50),
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    badge_title VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tutor Live Session Registrations & Attendance Table
CREATE TABLE IF NOT EXISTS public.training_live_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.training_live_sessions(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    tutor_name VARCHAR(200) NOT NULL,
    tutor_avatar TEXT,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attended BOOLEAN NOT NULL DEFAULT false,
    attended_minutes INT DEFAULT 0,
    certificate_issued BOOLEAN NOT NULL DEFAULT false,
    certificate_code VARCHAR(100),
    feedback_rating INT,
    feedback_notes TEXT,
    UNIQUE (session_id, tutor_id)
);

-- 3. Live Polls and Knowledge Checks Table
CREATE TABLE IF NOT EXISTS public.training_live_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.training_live_sessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- e.g. ["Option A", "Option B", "Option C"]
    correct_option_index INT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE public.training_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_live_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_live_polls ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Public read live sessions" ON public.training_live_sessions FOR SELECT USING (true);
CREATE POLICY "Tutors manage registrations" ON public.training_live_registrations FOR ALL USING (true);
CREATE POLICY "Public read live polls" ON public.training_live_polls FOR SELECT USING (true);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled ON public.training_live_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_live_registrations_session ON public.training_live_registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_live_registrations_tutor ON public.training_live_registrations(tutor_id);

-- 7. Seed Initial Live Masterclass Cohorts
INSERT INTO public.training_live_sessions (
    slug,
    title,
    headline,
    description,
    trainer_name,
    trainer_avatar,
    trainer_role,
    category,
    scheduled_at,
    duration_minutes,
    max_attendees,
    current_attendees,
    status,
    video_room_id,
    is_mandatory,
    badge_title
) VALUES
(
    'live-interactive-classroom-and-latex-whiteboard-masterclass',
    'Live Workshop: Sabina Interactive Classroom & LaTeX Whiteboard Mastery',
    'Hands-on live broadcast demonstrating LaTeX formulas, PDF annotations, and screen-sharing tools with live Q&A.',
    'Join our Lead Educational Technologist for an interactive group training workshop. Learn keyboard shortcuts, mathematical formula rendering, diagram plotting on the digital whiteboard, and troubleshooting audio/video issues under pressure.',
    'Dr. Marcus Vance',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'Lead Educational Technologist & Master Trainer',
    'Classroom Tools',
    NOW() + INTERVAL '2 days',
    60,
    100,
    34,
    'scheduled',
    'room-live-classroom-mastery',
    true,
    'Sabina Live Classroom Pro'
),
(
    'live-safeguarding-gdpr-and-boundary-compliance-simulation',
    'Live Cohort: Safeguarding, GDPR & Ethical Boundary Simulation',
    'Mandatory interactive group session analyzing real-world ethical dilemmas and child protection scenarios.',
    'A mandatory live cohort workshop focusing on UK/US child safeguarding standards, reporting obligations, avoiding unmonitored communication channels, and handling sensitive student situations appropriately.',
    'Sarah Jenkins, JD',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    'Head of Trust, Safety & Compliance',
    'Safeguarding',
    NOW() + INTERVAL '4 days',
    75,
    150,
    68,
    'scheduled',
    'room-live-safeguarding-cohort',
    true,
    'Certified Safeguarding Practitioner'
),
(
    'live-socratic-questioning-and-active-pedagogy-lab',
    'Live Practice Lab: Socratic Questioning & 70/30 Student Talk-Time',
    'Live peer breakout practice session on active student engagement and conceptual diagnostic questioning.',
    'Step up your teaching impact. In this live practice lab, tutors practice diagnostic questioning techniques and participate in live peer simulations with instant master trainer feedback.',
    'Prof. Alistair Finch',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    'Professor of Educational Psychology',
    'Pedagogy',
    NOW() + INTERVAL '6 days',
    60,
    80,
    29,
    'scheduled',
    'room-live-socratic-lab',
    false,
    'Master Socratic Facilitator'
),
(
    'live-high-converting-trial-lessons-and-parent-retention-clinic',
    'Live Clinic: High-Converting Trial Lessons & Parent Consultations',
    'Actionable framework to convert 85%+ of 25-minute trial lessons into long-term recurrent tutoring subscriptions.',
    'Master the anatomy of high-converting intro classes. Learn how to conduct rapid student diagnostics, co-design customized study roadmaps, and communicate effectively with parents during post-lesson wrap-ups.',
    'Elena Rostova, M.Ed.',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    'Top 1% Super Tutor & Retention Coach',
    'Business & Growth',
    NOW() + INTERVAL '8 days',
    60,
    100,
    47,
    'scheduled',
    'room-live-trial-clinic',
    false,
    'Top Converter & Retention Specialist'
)
ON CONFLICT (slug) DO NOTHING;
