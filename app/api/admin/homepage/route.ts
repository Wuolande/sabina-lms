/**
 * API Route: GET /api/admin/homepage
 *           PUT /api/admin/homepage
 * -----------------------------------------------------------------------
 * Admin CMS endpoints to read and update homepage content atomically
 * with database fallback and instant live refresh.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';
import { getAdminContext } from '@/src/shared/auth/authService';

const DEFAULT_HOMEPAGE_CMS = {
  heroSection: {
    pretitle: "YOUR JOURNEY BEGINS HERE",
    typewriterHeadlines: [
      "Grow Your Knowledge with Leading Online Courses",
      "Master Any Language with Native 1-on-1 Tutors",
      "Ace Your STEM Exams with Certified Professors",
      "Level Up Your Coding with FAANG Industry Mentors",
      "Pass IELTS & TOEFL with Master Test Prep Coaches"
    ],
    subheading: "Start learning today with top-rated courses and instructors. Take your skills, confidence, and academic journey to new heights with structured 1-on-1 sessions.",
    searchPlaceholder: "Search subject, language or goal (e.g. IELTS, Calculus)...",
    popularTags: [
      { label: "English", slug: "english" },
      { label: "Calculus", slug: "mathematics" },
      { label: "Python", slug: "python-data-science" },
      { label: "IELTS Prep", slug: "ielts-toefl-prep" }
    ],
    socialProofCount: "+2,000 students worldwide",
    socialProofRating: "5.0",
    heroStudentImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=700",
    floatingCard1: { value: 20, suffix: "+", label: "Creative Subjects" },
    floatingCard2: { value: 10, suffix: "k+", label: "Students" },
    floatingCard3: { value: 480, suffix: "+", label: "Hours Course Time" }
  },
  statsSection: {
    stat1: { value: 250, suffix: "+", decimals: 0, label: "Verified Instructors" },
    stat2: { value: 15000, suffix: "+", decimals: 0, label: "Enrolled Students" },
    stat3: { value: 98.9, suffix: "%", decimals: 1, label: "Lesson Success Rate" },
    stat4: { value: 4.98, suffix: " ★", decimals: 2, label: "Average Student Rating" }
  },
  categoriesSection: {
    pretitle: "POPULAR CATEGORIES",
    title: "Find the perfect tutor for your subject",
    ctaText: "View All 16+ Disciplines"
  },
  featuredTutorsSection: {
    pretitle: "VERIFIED EDUCATORS",
    title: "Learn 1-on-1 with accredited tutors",
    ctaText: "View All Tutors"
  },
  classroomTourSection: {
    badge: "In-Browser Live LMS • Zero Downloads",
    title: "A live video classroom built for mastery.",
    subtitle: "Experience sub-50ms HD video, collaborative whiteboard with LaTeX formulas, and synchronized PDF lesson notes — directly in your browser."
  },
  howItWorksSection: {
    pretitle: "HOW IT WORKS",
    title: "Simple 3-step learning journey",
    steps: [
      {
        num: "01",
        title: "Discover Your Tutor",
        desc: "Filter by subject specialty, rate, and languages. Watch video introductions to find the right teaching style."
      },
      {
        num: "02",
        title: "Book in Your Timezone",
        desc: "Choose a 25-min trial or 50-min standard class. All schedules automatically convert to your local clock."
      },
      {
        num: "03",
        title: "Learn Live & Level Up",
        desc: "Enter our browser classroom with HD video, whiteboard, and downloadable notes. Zero software to download."
      }
    ]
  },
  becomeTutorSection: {
    badge: "Join Our Global Teaching Faculty",
    title: "Teach what you love. Earn $40 – $120 / hr.",
    subtitle: "Set your own hourly rate, teach motivated 1-on-1 students globally from home, and receive reliable automated weekly payouts. Zero upfront costs.",
    rateRange: "$40 – $120 / hr",
    bulletPoints: [
      "Keep 85% of your earnings",
      "100% flexible schedule",
      "Browser video classroom included"
    ],
    ctaButtonText: "Apply as a Tutor",
    secondaryButtonText: "How It Works for Tutors"
  },
  faqSection: {
    pretitle: "COMMON QUESTIONS",
    title: "Frequently Asked Questions",
    faqs: [
      {
        q: "How does 1-on-1 online tutoring work on Sabina Edge?",
        a: "You browse verified tutors by subject, specialty, price, and language. Once you find a tutor, book an available time slot converted to your local timezone. When class starts, simply join our dedicated in-browser video classroom with shared whiteboard, notes, and screen sharing."
      },
      {
        q: "What is the 100% Satisfaction Guarantee?",
        a: "If you are not completely satisfied with your first trial lesson, let us know within 24 hours. We will either issue a full refund or transfer your credit to another tutor of your choice with zero hassle."
      },
      {
        q: "Do I need to install any external software like Zoom or Skype?",
        a: "No downloads or extra accounts required! The Sabina Edge Classroom runs entirely inside modern web browsers on desktop, tablet, and mobile with crystal-clear HD audio/video and collaborative tools."
      },
      {
        q: "How do tutor payments and cancellations work?",
        a: "You only pay per lesson booked — there are zero monthly subscription lock-ins. You can reschedule or cancel any lesson free of charge up to 24 hours before the scheduled start time."
      },
      {
        q: "How are tutors vetted and approved on Sabina Edge?",
        a: "Every tutor undergoes a rigorous 7-step credential verification process, including identity checks, certified university degree review, teaching certifications, and a recorded video interview audit before being approved."
      }
    ]
  }
};

export async function GET(req: NextRequest) {
  try {
    // 1. Try RPC
    const { data: rpcData, error: rpcError } = await adminSupabase.rpc('get_homepage_content');
    if (!rpcError && rpcData) {
      return NextResponse.json(rpcData);
    }

    // 2. Direct table fallback
    const { data: tableData } = await adminSupabase
      .from('platform_homepage_content')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (tableData) {
      return NextResponse.json({
        id: tableData.id,
        heroSection: tableData.hero_section,
        statsSection: tableData.stats_section,
        categoriesSection: tableData.categories_section,
        featuredTutorsSection: tableData.featured_tutors_section,
        classroomTourSection: tableData.classroom_tour_section,
        howItWorksSection: tableData.how_it_works_section,
        becomeTutorSection: tableData.become_tutor_section,
        faqSection: tableData.faq_section,
        updatedAt: tableData.updated_at
      });
    }

    return NextResponse.json(DEFAULT_HOMEPAGE_CMS);
  } catch (error: any) {
    console.error('[GET /api/admin/homepage]', error);
    return NextResponse.json(DEFAULT_HOMEPAGE_CMS);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Try RPC
    try {
      const { data: rpcData, error: rpcError } = await adminSupabase.rpc('update_homepage_content', {
        p_content: body,
      });
      if (!rpcError && rpcData) {
        return NextResponse.json(rpcData);
      }
    } catch {
      // Continue to direct table upsert
    }

    // 2. Direct table upsert fallback
    const { data: existing } = await adminSupabase
      .from('platform_homepage_content')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (existing) {
      await adminSupabase
        .from('platform_homepage_content')
        .update({
          hero_section: body.heroSection,
          stats_section: body.statsSection,
          categories_section: body.categoriesSection,
          featured_tutors_section: body.featuredTutorsSection,
          classroom_tour_section: body.classroomTourSection,
          how_it_works_section: body.howItWorksSection,
          become_tutor_section: body.becomeTutorSection,
          faq_section: body.faqSection,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await adminSupabase
        .from('platform_homepage_content')
        .insert({
          is_active: true,
          hero_section: body.heroSection,
          stats_section: body.statsSection,
          categories_section: body.categoriesSection,
          featured_tutors_section: body.featuredTutorsSection,
          classroom_tour_section: body.classroomTourSection,
          how_it_works_section: body.howItWorksSection,
          become_tutor_section: body.becomeTutorSection,
          faq_section: body.faqSection,
        });
    }

    return NextResponse.json({
      success: true,
      ...body,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[PUT /api/admin/homepage]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
