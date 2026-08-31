/**
 * API Route: GET /api/blogs/[slug]
 * -----------------------------------------------------------------------
 * Public endpoint to fetch an individual published article by its slug.
 * Also fetches related articles in the same category.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverBlogService } from '@/src/modules/blog/services/blogService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const post = await serverBlogService.getPostBySlug(slug);

    if (!post) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Fetch related articles
    const relatedPosts = await serverBlogService.getRelatedPosts(post.category, post.id, 3);

    return NextResponse.json({ post, relatedPosts });
  } catch (error: any) {
    console.error('[GET /api/blogs/[slug]]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
