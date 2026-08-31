import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/src/shared/database/supabase';
import { isAdmin } from '@/src/shared/auth/authService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isUserAdmin = await isAdmin(request);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getAdminSupabaseClient();

    const { error } = await supabase
      .from('lesson_reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/admin/reviews/[id]] DB Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Review successfully removed' });
  } catch (error: any) {
    console.error('[DELETE /api/admin/reviews/[id]]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
