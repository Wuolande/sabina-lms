import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/src/shared/database/supabase';
import { isAdmin } from '@/src/shared/auth/authService';

export async function GET(request: NextRequest) {
  try {
    const isUserAdmin = await isAdmin(request);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const supabase = getAdminSupabaseClient();

    const { data: reviews, error } = await supabase
      .from('lesson_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        student:users!lesson_reviews_student_id_fkey(id, email, display_name, avatar_url),
        tutor:tutor_profiles!lesson_reviews_tutor_id_fkey(
          id,
          user:users!tutor_profiles_user_id_fkey(id, email, display_name, avatar_url)
        ),
        lesson:lessons!lesson_reviews_lesson_id_fkey(
          id,
          subject_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/admin/reviews] DB Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const reviewItems = (reviews || []).map((r: any) => {
      const student = r.student || {};
      const tutor = r.tutor || {};
      const tutorUser = tutor.user || {};

      return {
        id: r.id,
        rating: Number(r.rating) || 5,
        comment: r.comment || '',
        createdAt: r.created_at,
        studentId: student.id || '',
        studentName: student.display_name || 'Student',
        studentAvatar: student.avatar_url || '',
        studentEmail: student.email || '',
        tutorId: tutor.id || '',
        tutorName: tutorUser.display_name || 'Tutor',
        tutorAvatar: tutorUser.avatar_url || '',
        status: 'PUBLISHED',
      };
    });

    const totalCount = reviewItems.length;
    const avgRating = totalCount > 0
      ? Math.round((reviewItems.reduce((acc, r) => acc + r.rating, 0) / totalCount) * 10) / 10
      : 5.0;

    return NextResponse.json({
      summary: {
        totalReviews: totalCount,
        averageRating: avgRating,
        fiveStarReviews: reviewItems.filter((r) => r.rating === 5).length,
        reportedCount: 0,
      },
      reviews: reviewItems,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/reviews]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
