/**
 * API Route: GET, PUT, DELETE /api/admin/blogs/[id]
 * -----------------------------------------------------------------------
 * Admin CRUD endpoints for individual blog articles.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/src/shared/auth/authService';
import { serverBlogService } from '@/src/modules/blog/services/blogService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAdminContext(req);
    const { id } = await params;

    // Use service method (uses dedicated blog client)
    const post = await serverBlogService.getPostBySlug(id).catch(() => null);

    // If no match by slug, try getAllPostsAdmin with id filter
    const allRes = await serverBlogService.getAllPostsAdmin({ pageSize: 100 });
    const found = allRes.posts.find((p) => p.id === id) || post;

    if (!found) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ post: found });
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
    await getAdminContext(req);
    const { id } = await params;
    const body = await req.json();

    const updatedPost = await serverBlogService.updatePost(id, body);
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
    await getAdminContext(req);
    const { id } = await params;

    await serverBlogService.deletePost(id);
    return NextResponse.json({ success: true, message: 'Article deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE /api/admin/blogs/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete article' },
      { status: error.statusCode || 500 }
    );
  }
}
