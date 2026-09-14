import { NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET() {
  try {
    const [courses, certsRes, enrRes, tutorsRes] = await Promise.all([
      trainingRepository.getCourses(),
      adminSupabase.from('tutor_certificates').select('id, course_id'),
      adminSupabase.from('tutor_course_enrollments').select('id, status'),
      adminSupabase.from('tutor_profiles').select('id'),
    ]);

    const totalCourses = courses.length;
    const certificatesCount = certsRes.data?.length || 0;
    const enrollmentsCount = enrRes.data?.length || 0;
    const totalTutors = tutorsRes.data?.length || 0;

    const completionRate = enrollmentsCount > 0
      ? Math.min(100, Math.round((certificatesCount / enrollmentsCount) * 100))
      : 0;

    const safeguardingCourse = courses.find((c) =>
      c.slug.includes('safeguarding') || c.category === 'Safeguarding'
    );
    const safeguardingCertsCount = safeguardingCourse
      ? (certsRes.data?.filter((c) => c.course_id === safeguardingCourse.id).length || 0)
      : 0;

    const safeguardingComplianceRate = totalTutors > 0
      ? Math.min(100, Math.round((safeguardingCertsCount / totalTutors) * 100))
      : 0;

    return NextResponse.json({
      courses,
      stats: {
        totalCourses,
        totalCertificatesIssued: certificatesCount,
        totalEnrollments: enrollmentsCount,
        averageCompletionRate: completionRate,
        safeguardingComplianceRate,
      },
    });
  } catch (error) {
    console.error('Error fetching admin training data:', error);
    return NextResponse.json({ error: 'Failed to fetch admin training stats' }, { status: 500 });
  }
}
