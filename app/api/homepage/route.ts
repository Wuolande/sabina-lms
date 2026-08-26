import { NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET() {
  try {
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

    // Fallback to internal API
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/homepage`).catch(() => null);
    if (res && res.ok) {
      return NextResponse.json(await res.json());
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
