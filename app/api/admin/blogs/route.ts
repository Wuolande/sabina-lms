/**
 * API Route: GET & POST /api/admin/blogs
 * -----------------------------------------------------------------------
 * Admin endpoints to list all articles (including drafts) and create new posts.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/src/shared/auth/authService';
import { serverBlogService } from '@/src/modules/blog/services/blogService';

export const dynamic = 'force-dynamic';

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
      category: category === 'All' ? undefined : category,
      status,
      page,
      pageSize,
    });

    console.log(`[GET /api/admin/blogs] Returned ${response.posts.length}/${response.total} posts`);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[GET /api/admin/blogs] ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized or server error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await getAdminContext(req);
    const body = await req.json();

    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'Article title is required.' }, { status: 400 });
    }

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'Article content cannot be empty.' }, { status: 400 });
    }

    const createdPost = await serverBlogService.createPost(body);
    return NextResponse.json({ success: true, post: createdPost }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/admin/blogs] ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create article' },
      { status: error.statusCode || 500 }
    );
  }
}
