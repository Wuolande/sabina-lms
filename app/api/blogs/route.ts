/**
 * API Route: GET /api/blogs
 * -----------------------------------------------------------------------
 * Public endpoint for fetching published blog posts with filtering & pagination.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverBlogService } from '@/src/modules/blog/services/blogService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '9', 10);
    const recent = searchParams.get('recent');

    if (recent) {
      const limit = parseInt(recent, 10) || 3;
      const recentPosts = await serverBlogService.getRecentPosts(limit);
      console.log(`[GET /api/blogs?recent=${limit}] Returned ${recentPosts.length} posts`);
      return NextResponse.json({ posts: recentPosts });
    }

    const response = await serverBlogService.getPublishedPosts({
      search,
      category: category === 'All' ? undefined : category,
      page,
      pageSize,
    });

    console.log(`[GET /api/blogs] Returned ${response.posts.length}/${response.total} posts`);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[GET /api/blogs] ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load blog posts' },
      { status: 500 }
    );
  }
}
