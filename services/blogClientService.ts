/**
 * Public Blog Client Service
 * -----------------------------------------------------------------------
 * Frontend service for querying published blogs, categories, and articles.
 * -----------------------------------------------------------------------
 */

import { BlogPost, BlogListResponse } from '@/src/modules/blog/types/blogTypes';

export const blogClientService = {
  /**
   * Fetch published blog posts with pagination and category search
   */
  async getPosts(options: {
    category?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<BlogListResponse> {
    const params = new URLSearchParams();
    if (options.category && options.category !== 'All') params.set('category', options.category);
    if (options.search) params.set('search', options.search);
    if (options.page) params.set('page', String(options.page));
    if (options.pageSize) params.set('pageSize', String(options.pageSize));

    const res = await fetch(`/api/blogs?${params.toString()}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error('Failed to load blog posts');
    }

    return res.json();
  },

  /**
   * Fetch recent articles for homepage or showcase sections
   */
  async getRecentPosts(limit: number = 3): Promise<BlogPost[]> {
    try {
      const res = await fetch(`/api/blogs?recent=${limit}`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.posts || [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch an individual article by slug
   */
  async getPostBySlug(slug: string): Promise<{ post: BlogPost; relatedPosts: BlogPost[] } | null> {
    try {
      const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },
};
