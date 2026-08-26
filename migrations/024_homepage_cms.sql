-- ====================================================================
-- MIGRATION 024: Homepage CMS & Dynamic Content Management
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.platform_homepage_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    hero_section JSONB NOT NULL,
    stats_section JSONB NOT NULL,
    categories_section JSONB NOT NULL,
    featured_tutors_section JSONB NOT NULL,
    classroom_tour_section JSONB NOT NULL,
    how_it_works_section JSONB NOT NULL,
    become_tutor_section JSONB NOT NULL,
    faq_section JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES public.users(id)
);

-- Seed default initial homepage content
INSERT INTO public.platform_homepage_content (
    is_active,
    hero_section,
    stats_section,
    categories_section,
    featured_tutors_section,
    classroom_tour_section,
    how_it_works_section,
    become_tutor_section,
    faq_section
) VALUES (
    true,
    jsonb_build_object(
        'pretitle', 'YOUR JOURNEY BEGINS HERE',
        'typewriterHeadlines', jsonb_build_array(
            'Grow Your Knowledge with Leading Online Courses',
            'Master Any Language with Native 1-on-1 Tutors',
            'Ace Your STEM Exams with Certified Professors',
            'Level Up Your Coding with FAANG Industry Mentors',
            'Pass IELTS & TOEFL with Master Test Prep Coaches'
        ),
        'subheading', 'Start learning today with top-rated courses and instructors. Take your skills, confidence, and academic journey to new heights with structured 1-on-1 sessions.',
        'searchPlaceholder', 'Search subject, language or goal (e.g. IELTS, Calculus)...',
        'popularTags', jsonb_build_array(
            jsonb_build_object('label', 'English', 'slug', 'english'),
            jsonb_build_object('label', 'Calculus', 'slug', 'mathematics'),
            jsonb_build_object('label', 'Python', 'slug', 'python-data-science'),
            jsonb_build_object('label', 'IELTS Prep', 'slug', 'ielts-toefl-prep')
        ),
        'socialProofCount', '+2,000 students worldwide',
        'socialProofRating', '5.0',
        'heroStudentImage', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=700',
        'floatingCard1', jsonb_build_object('value', 20, 'suffix', '+', 'label', 'Creative Subjects'),
        'floatingCard2', jsonb_build_object('value', 10, 'suffix', 'k+', 'label', 'Students'),
        'floatingCard3', jsonb_build_object('value', 480, 'suffix', '+', 'label', 'Hours Course Time')
    ),
    jsonb_build_object(
        'stat1', jsonb_build_object('value', 250, 'suffix', '+', 'decimals', 0, 'label', 'Verified Instructors'),
        'stat2', jsonb_build_object('value', 15000, 'suffix', '+', 'decimals', 0, 'label', 'Enrolled Students'),
        'stat3', jsonb_build_object('value', 98.9, 'suffix', '%', 'decimals', 1, 'label', 'Lesson Success Rate'),
        'stat4', jsonb_build_object('value', 4.98, 'suffix', ' ★', 'decimals', 2, 'label', 'Average Student Rating')
    ),
    jsonb_build_object(
        'pretitle', 'POPULAR CATEGORIES',
        'title', 'Find the perfect tutor for your subject',
        'ctaText', 'View All 16+ Disciplines'
    ),
    jsonb_build_object(
        'pretitle', 'VERIFIED EDUCATORS',
        'title', 'Learn 1-on-1 with accredited tutors',
        'ctaText', 'View All Tutors'
    ),
    jsonb_build_object(
        'badge', 'In-Browser Live LMS • Zero Downloads',
        'title', 'A live video classroom built for mastery.',
        'subtitle', 'Experience sub-50ms HD video, collaborative whiteboard with LaTeX formulas, and synchronized PDF lesson notes — directly in your browser.'
    ),
    jsonb_build_object(
        'pretitle', 'HOW IT WORKS',
        'title', 'Simple 3-step learning journey',
        'steps', jsonb_build_array(
            jsonb_build_object(
                'num', '01',
                'title', 'Discover Your Tutor',
                'desc', 'Filter by subject specialty, rate, and languages. Watch video introductions to find the right teaching style.'
            ),
            jsonb_build_object(
                'num', '02',
                'title', 'Book in Your Timezone',
                'desc', 'Choose a 25-min trial or 50-min standard class. All schedules automatically convert to your local clock.'
            ),
            jsonb_build_object(
                'num', '03',
                'title', 'Learn Live & Level Up',
                'desc', 'Enter our browser classroom with HD video, whiteboard, and downloadable notes. Zero software to download.'
            )
        )
    ),
    jsonb_build_object(
        'badge', 'Join Our Global Teaching Faculty',
        'title', 'Teach what you love. Earn $40 – $120 / hr.',
        'subtitle', 'Set your own hourly rate, teach motivated 1-on-1 students globally from home, and receive reliable automated weekly payouts. Zero upfront costs.',
        'rateRange', '$40 – $120 / hr',
        'bulletPoints', jsonb_build_array(
            'Keep 85% of your earnings',
            '100% flexible schedule',
            'Browser video classroom included'
        ),
        'ctaButtonText', 'Apply as a Tutor',
        'secondaryButtonText', 'How It Works for Tutors'
    ),
    jsonb_build_object(
        'pretitle', 'COMMON QUESTIONS',
        'title', 'Frequently Asked Questions',
        'faqs', jsonb_build_array(
            jsonb_build_object(
                'q', 'How does 1-on-1 online tutoring work on Sabina Edge?',
                'a', 'You browse verified tutors by subject, specialty, price, and language. Once you find a tutor, book an available time slot converted to your local timezone. When class starts, simply join our dedicated in-browser video classroom with shared whiteboard, notes, and screen sharing.'
            ),
            jsonb_build_object(
                'q', 'What is the 100% Satisfaction Guarantee?',
                'a', 'If you are not completely satisfied with your first trial lesson, let us know within 24 hours. We will either issue a full refund or transfer your credit to another tutor of your choice with zero hassle.'
            ),
            jsonb_build_object(
                'q', 'Do I need to install any external software like Zoom or Skype?',
                'a', 'No downloads or extra accounts required! The Sabina Edge Classroom runs entirely inside modern web browsers on desktop, tablet, and mobile with crystal-clear HD audio/video and collaborative tools.'
            ),
            jsonb_build_object(
                'q', 'How do tutor payments and cancellations work?',
                'a', 'You only pay per lesson booked — there are zero monthly subscription lock-ins. You can reschedule or cancel any lesson free of charge up to 24 hours before the scheduled start time.'
            ),
            jsonb_build_object(
                'q', 'How are tutors vetted and approved on Sabina Edge?',
                'a', 'Every tutor undergoes a rigorous 7-step credential verification process, including identity checks, certified university degree review, teaching certifications, and a recorded video interview audit before being approved.'
            )
        )
    )
);

-- Stored Procedure: get_homepage_content
CREATE OR REPLACE FUNCTION public.get_homepage_content()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id,
        'heroSection', hero_section,
        'statsSection', stats_section,
        'categoriesSection', categories_section,
        'featuredTutorsSection', featured_tutors_section,
        'classroomTourSection', classroom_tour_section,
        'howItWorksSection', how_it_works_section,
        'becomeTutorSection', become_tutor_section,
        'faqSection', faq_section,
        'updatedAt', updated_at
    ) INTO result
    FROM public.platform_homepage_content
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN result;
END;
$$;

-- Stored Procedure: update_homepage_content
CREATE OR REPLACE FUNCTION public.update_homepage_content(
    p_content JSONB,
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    result JSONB;
BEGIN
    SELECT id INTO v_id
    FROM public.platform_homepage_content
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_id IS NOT NULL THEN
        UPDATE public.platform_homepage_content
        SET
            hero_section = COALESCE(p_content->'heroSection', hero_section),
            stats_section = COALESCE(p_content->'statsSection', stats_section),
            categories_section = COALESCE(p_content->'categoriesSection', categories_section),
            featured_tutors_section = COALESCE(p_content->'featuredTutorsSection', featured_tutors_section),
            classroom_tour_section = COALESCE(p_content->'classroomTourSection', classroom_tour_section),
            how_it_works_section = COALESCE(p_content->'howItWorksSection', how_it_works_section),
            become_tutor_section = COALESCE(p_content->'becomeTutorSection', become_tutor_section),
            faq_section = COALESCE(p_content->'faqSection', faq_section),
            updated_at = now(),
            updated_by = p_admin_id
        WHERE id = v_id;
    ELSE
        INSERT INTO public.platform_homepage_content (
            is_active,
            hero_section,
            stats_section,
            categories_section,
            featured_tutors_section,
            classroom_tour_section,
            how_it_works_section,
            become_tutor_section,
            faq_section,
            updated_by
        ) VALUES (
            true,
            p_content->'heroSection',
            p_content->'statsSection',
            p_content->'categoriesSection',
            p_content->'featuredTutorsSection',
            p_content->'classroomTourSection',
            p_content->'howItWorksSection',
            p_content->'becomeTutorSection',
            p_content->'faqSection',
            p_admin_id
        );
    END IF;

    -- Return refreshed content
    RETURN public.get_homepage_content();
END;
$$;
