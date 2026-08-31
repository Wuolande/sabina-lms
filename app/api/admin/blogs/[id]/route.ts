/**
 * API Route: GET, PUT, DELETE /api/admin/blogs/[id]
 * -----------------------------------------------------------------------
 * Admin CRUD endpoints for individual blog articles.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/src/shared/auth/authService';
import { serverBlogService } from '@/src/modules/blog/services/blogService';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAdminContext(req);
    const { id } = await params;

    const { data, error } = await adminSupabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ post: data });
  } catch (error: any) {
    console.error('[GET /api/admin/blogs/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminContext(req);
    const { id } = await params;
    const body = await req.json();

    const updatedPost = await serverBlogService.updatePost(id, body);

    // Record audit log
    try {
      await adminSupabase.from('audit_logs').insert({
        actor_user_id: admin.id,
        action: 'UPDATE_BLOG_POST',
        entity_type: 'BLOG',
        entity_id: id,
        metadata: { title: updatedPost.title, isPublished: updatedPost.isPublished },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error: any) {
    console.error('[PUT /api/admin/blogs/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update article' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminContext(req);
    const { id } = await params;

    await serverBlogService.deletePost(id);

    // Record audit log
    try {
      await adminSupabase.from('audit_logs').insert({
        actor_user_id: admin.id,
        action: 'DELETE_BLOG_POST',
        entity_type: 'BLOG',
        entity_id: id,
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, message: 'Article deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE /api/admin/blogs/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete article' },
      { status: error.statusCode || 500 }
    );
  }
}
