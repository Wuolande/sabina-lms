/**
 * API Route: GET & POST /api/admin/blogs
 * -----------------------------------------------------------------------
 * Admin endpoints to list all articles (including drafts) and create new posts.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/src/shared/auth/authService';
import { serverBlogService } from '@/src/modules/blog/services/blogService';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET(req: NextRequest) {
  try {
    await getAdminContext(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = (searchParams.get('status') as any) || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const response = await serverBlogService.getAllPostsAdmin({
      search,
      category,
      status,
      page,
      pageSize,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[GET /api/admin/blogs]', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized or server error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    const body = await req.json();

    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'Article title is required.' }, { status: 400 });
    }

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'Article content cannot be empty.' }, { status: 400 });
    }

    const createdPost = await serverBlogService.createPost(body);

    // Record audit log
    try {
      await adminSupabase.from('audit_logs').insert({
        actor_user_id: admin.id,
        action: 'CREATE_BLOG_POST',
        entity_type: 'BLOG',
        entity_id: createdPost.id,
        metadata: { title: createdPost.title, slug: createdPost.slug },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, post: createdPost }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/admin/blogs]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create article' },
      { status: error.statusCode || 500 }
    );
  }
}
