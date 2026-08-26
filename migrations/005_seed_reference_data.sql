-- ====================================================================
-- MIGRATION 005: Reference Data & RBAC Seed
-- ====================================================================

-- 1. Seed Roles
INSERT INTO public.roles (id, name, description, is_system_role)
VALUES
    ('SUPER_ADMIN', 'Super Administrator', 'Full system access and authority across all tenants and configurations.', true),
    ('ADMIN', 'Administrator', 'Administrative authority for tutor management, applications, bookings, and audit review.', true),
    ('TUTOR', 'Tutor', 'Certified instructor with profile, availability, lesson delivery, and earnings management.', true),
    ('STUDENT', 'Student', 'Learner with booking, lesson attendance, review, and payment capabilities.', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Permissions
INSERT INTO public.permissions (id, module, name, description)
VALUES
    ('tutors.view', 'tutors', 'View Tutors', 'View tutor directory, profiles, and analytics.'),
    ('tutors.update', 'tutors', 'Update Tutors', 'Modify tutor public profile, pricing, and settings.'),
    ('tutors.suspend', 'tutors', 'Suspend Tutors', 'Suspend tutor accounts and restrict platform access.'),
    ('tutors.reactivate', 'tutors', 'Reactivate Tutors', 'Reactivate suspended tutor accounts.'),
    ('tutor_applications.view', 'tutor_applications', 'View Applications', 'Inspect submitted tutor applications.'),
    ('tutor_applications.review', 'tutor_applications', 'Review Applications', 'Start review and assign reviewer to applications.'),
    ('tutor_applications.request_changes', 'tutor_applications', 'Request Application Changes', 'Request amendments or additional documents from applicants.'),
    ('tutor_applications.approve', 'tutor_applications', 'Approve Applications', 'Approve tutor application and provision active tutor profile.'),
    ('tutor_applications.reject', 'tutor_applications', 'Reject Applications', 'Reject tutor application with stated reason.'),
    ('audit.view', 'audit', 'View Audit Logs', 'Inspect immutable administrative audit trail.')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Role Permissions (SUPER_ADMIN and ADMIN get all permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'SUPER_ADMIN', id FROM public.permissions
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'ADMIN', id FROM public.permissions
ON CONFLICT DO NOTHING;

-- 4. Seed Standard Languages
INSERT INTO public.languages (name, code, native_name)
VALUES
    ('English', 'en', 'English'),
    ('Spanish', 'es', 'Español'),
    ('French', 'fr', 'Français'),
    ('German', 'de', 'Deutsch'),
    ('Mandarin Chinese', 'zh', '??'),
    ('Japanese', 'ja', '???'),
    ('Arabic', 'ar', '???????'),
    ('Portuguese', 'pt', 'Português'),
    ('Swahili', 'sw', 'Kiswahili'),
    ('Russian', 'ru', '???????'),
    ('Italian', 'it', 'Italiano')
ON CONFLICT (name) DO NOTHING;

-- 5. Seed Standard Subjects
INSERT INTO public.subjects (name, slug, category, description, icon_name)
VALUES
    ('English Conversation', 'english-conversation', 'Languages', 'Improve fluency, accent, and real-world conversation skills.', 'Languages'),
    ('Business English', 'business-english', 'Languages', 'Professional communication, presentations, and executive writing.', 'Briefcase'),
    ('IELTS & TOEFL Prep', 'ielts-toefl-prep', 'Exam Prep', 'Targeted test strategies for high exam scores.', 'GraduationCap'),
    ('Calculus & Algebra', 'calculus-algebra', 'STEM', 'Master pure and applied mathematics from foundational to advanced.', 'Calculator'),
    ('Python & Data Science', 'python-data-science', 'Coding', 'Learn python programming, algorithms, machine learning and data analysis.', 'Code'),
    ('Physics & Mechanics', 'physics-mechanics', 'STEM', 'Deep dive into Newtonian physics, thermodynamics, and quantum concepts.', 'Atom'),
    ('Web Development (React & Node)', 'web-development', 'Coding', 'Full-stack modern web engineering.', 'Terminal'),
    ('SAT & ACT Math', 'sat-act-math', 'Exam Prep', 'Comprehensive math test prep and timing drills.', 'BookOpen')
ON CONFLICT (slug) DO NOTHING;
