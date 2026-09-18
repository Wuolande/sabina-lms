-- ====================================================================
-- MIGRATION 030: Purge Demo Data & Retain 5 High-Demand Subjects
-- ====================================================================

-- 1. Purge Reviews, Comments, Lessons & Bookings
DELETE FROM public.lesson_reviews;
DELETE FROM public.lesson_materials;
DELETE FROM public.lessons;
DELETE FROM public.booking_disputes;
DELETE FROM public.bookings;

-- 2. Purge Messages, Conversations & Notifications
DELETE FROM public.messages;
DELETE FROM public.conversations;
DELETE FROM public.notifications;
DELETE FROM public.tutor_notifications;

-- 3. Purge Tutor Applications & Related Records
DELETE FROM public.tutor_application_documents;
DELETE FROM public.tutor_application_education;
DELETE FROM public.tutor_application_experience;
DELETE FROM public.tutor_application_languages;
DELETE FROM public.tutor_application_reviews;
DELETE FROM public.tutor_application_subjects;
DELETE FROM public.tutor_applications;

-- 4. Purge Tutor Profiles & Related Records
DELETE FROM public.tutor_subjects;
DELETE FROM public.tutor_languages;
DELETE FROM public.tutor_experiences;
DELETE FROM public.tutor_educations;
DELETE FROM public.tutor_certificates;
DELETE FROM public.tutor_certifications;
DELETE FROM public.tutor_schedule_settings;
DELETE FROM public.tutor_availability_rules;
DELETE FROM public.tutor_availability_exceptions;
DELETE FROM public.tutor_course_enrollments;
DELETE FROM public.tutor_module_progress;
DELETE FROM public.tutor_quiz_attempts;
DELETE FROM public.training_live_registrations;
DELETE FROM public.tutor_profiles;

-- 5. Purge Student Profiles & Related Records
DELETE FROM public.student_favorite_tutors;
DELETE FROM public.student_learning_goals;
DELETE FROM public.student_payment_methods;
DELETE FROM public.student_tutor_enrollments;
DELETE FROM public.student_profiles;

-- 6. Purge Demo File Assets (Keep only brand/platform assets if any)
DELETE FROM public.file_assets 
WHERE entity_type IN ('USER_AVATAR', 'USER_DOCUMENT', 'TUTOR_INTRO_VIDEO', 'TUTOR_CERTIFICATE')
  AND (owner_id IS NULL OR owner_id NOT IN (
    SELECT user_id FROM public.user_roles WHERE role_id IN ('ADMIN', 'SUPER_ADMIN')
  ));

-- 7. Purge Non-Admin Users (Preserve Administrator Account)
DELETE FROM public.user_roles 
WHERE user_id NOT IN (
    SELECT id FROM public.users WHERE email = 'admin@sabinaedge.com'
);

DELETE FROM public.users 
WHERE email != 'admin@sabinaedge.com';

-- 8. Purge Non-Admin Accounts in auth.users
DELETE FROM auth.users 
WHERE email != 'admin@sabinaedge.com';

-- 9. Prune Subjects Table to 5 High-Demand Subjects
DELETE FROM public.subjects 
WHERE slug NOT IN (
    'english-conversation',
    'business-english',
    'ielts-toefl-prep',
    'calculus-algebra',
    'python-data-science'
);

-- Ensure the 5 retained subjects are marked featured & active
UPDATE public.subjects 
SET is_active = true, is_featured = true
WHERE slug IN (
    'english-conversation',
    'business-english',
    'ielts-toefl-prep',
    'calculus-algebra',
    'python-data-science'
);
