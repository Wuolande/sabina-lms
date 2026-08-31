/**
 * Server Blog Service
 * -----------------------------------------------------------------------
 * Robust data access layer for published articles and admin blog CMS.
 * -----------------------------------------------------------------------
 */

import { adminSupabase } from '@/src/shared/database/supabase';
import {
  BlogPost,
  BlogPostPayload,
  BlogFilterOptions,
  BlogListResponse,
} from '../types/blogTypes';

function mapDbRowToBlogPost(row: any): BlogPost {
  let parsedTags: string[] = [];
  if (Array.isArray(row.tags)) {
    parsedTags = row.tags;
  } else if (typeof row.tags === 'string') {
    try {
      parsedTags = JSON.parse(row.tags);
    } catch {
      parsedTags = row.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  return {
    id: row.id,
    title: row.title || 'Untitled Article',
    slug: row.slug || '',
    excerpt: row.excerpt || '',
    content: row.content || '',
    author: row.author || 'Sabina Editorial Team',
    authorTitle: row.author_title || 'Education Specialist',
    authorAvatar: row.author_avatar || '',
    authorBio: row.author_bio || '',
    authorTwitter: row.author_twitter || '',
    category: row.category || 'General',
    featuredImage: row.featured_image || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80',
    readTime: row.read_time || '5 min read',
    tags: parsedTags,
    isPublished: row.is_published ?? (row.status === 'published'),
    status: (row.status as any) || (row.is_published ? 'published' : 'draft'),
    publishedAt: row.published_at || row.created_at,
    seoTitle: row.seo_title || row.title,
    seoDescription: row.seo_description || row.excerpt,
    seoKeywords: row.seo_keywords || '',
    canonicalUrl: row.canonical_url || '',
    ogImage: row.og_image || row.featured_image || '',
    schemaType: row.schema_type || 'EducationalArticle',
    metaRobots: row.meta_robots || 'index, follow',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export const serverBlogService = {
  /**
   * Fetch published blog posts for public frontend with filters & pagination
   */
  async getPublishedPosts(options: BlogFilterOptions = {}): Promise<BlogListResponse> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize || 9));
    const offset = (page - 1) * pageSize;

    let query = adminSupabase
      .from('blogs')
      .select('*', { count: 'exact' })
      .eq('is_published', true);

    if (options.category && options.category !== 'All') {
      query = query.ilike('category', `%${options.category}%`);
    }

    if (options.search && options.search.trim()) {
      const s = options.search.trim();
      query = query.or(`title.ilike.%${s}%,excerpt.ilike.%${s}%,author.ilike.%${s}%`);
    }

    query = query
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('[serverBlogService.getPublishedPosts]', error);
      throw new Error(error.message);
    }

    // Fetch categories with live counts
    const { data: allPosts } = await adminSupabase
      .from('blogs')
      .select('category')
      .eq('is_published', true);

    const categoryMap: Record<string, number> = {};
    allPosts?.forEach((p) => {
      const cat = p.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categories = Object.entries(categoryMap).map(([name, count]) => ({
      name,
      count,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      posts: (data || []).map(mapDbRowToBlogPost),
      total,
      page,
      pageSize,
      totalPages,
      categories,
    };
  },

  /**
   * Fetch a single post by URL slug
   */
  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await adminSupabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }

    return mapDbRowToBlogPost(data);
  },

  /**
   * Fetch recent posts (for homepage showcase or sidebar)
   */
  async getRecentPosts(limit: number = 3): Promise<BlogPost[]> {
    const { data, error } = await adminSupabase
      .from('blogs')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('[serverBlogService.getRecentPosts]', error);
      return [];
    }

    return (data || []).map(mapDbRowToBlogPost);
  },

  /**
   * Fetch related posts (by same category, excluding current post)
   */
  async getRelatedPosts(category: string, currentPostId: string, limit: number = 3): Promise<BlogPost[]> {
    const { data, error } = await adminSupabase
      .from('blogs')
      .select('*')
      .neq('id', currentPostId)
      .eq('is_published', true)
      .ilike('category', `%${category}%`)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return (data || []).map(mapDbRowToBlogPost);
  },

  /**
   * Admin: Fetch all posts (including drafts) with full filtering
   */
  async getAllPostsAdmin(options: BlogFilterOptions = {}): Promise<BlogListResponse> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 15));
    const offset = (page - 1) * pageSize;

    let query = adminSupabase.from('blogs').select('*', { count: 'exact' });

    if (options.status && options.status !== 'all') {
      if (options.status === 'published') {
        query = query.or('is_published.eq.true,status.eq.published');
      } else if (options.status === 'draft') {
        query = query.or('is_published.eq.false,status.eq.draft');
      }
    }

    if (options.category && options.category !== 'All') {
      query = query.ilike('category', `%${options.category}%`);
    }

    if (options.search && options.search.trim()) {
      const s = options.search.trim();
      query = query.or(`title.ilike.%${s}%,author.ilike.%${s}%,slug.ilike.%${s}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('[serverBlogService.getAllPostsAdmin]', error);
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      posts: (data || []).map(mapDbRowToBlogPost),
      total,
      page,
      pageSize,
      totalPages,
      categories: [],
    };
  },

  /**
   * Admin: Create a new blog post
   */
  async createPost(payload: BlogPostPayload): Promise<BlogPost> {
    const slug = payload.slug?.trim() || generateSlug(payload.title);
    const readTime = payload.readTime || calculateReadTime(payload.content || '');
    const isPublished = payload.isPublished ?? (payload.status === 'published');
    const status = payload.status || (isPublished ? 'published' : 'draft');
    const publishedAt = isPublished ? new Date().toISOString() : null;

    const row = {
      title: payload.title,
      slug,
      excerpt: payload.excerpt,
      content: payload.content,
      author: payload.author || 'Sabina Editorial Team',
      author_title: payload.authorTitle || 'Education Specialist',
      author_avatar: payload.authorAvatar || '',
      author_bio: payload.authorBio || '',
      author_twitter: payload.authorTwitter || '',
      category: payload.category || 'General',
      featured_image: payload.featuredImage,
      read_time: readTime,
      tags: payload.tags || [],
      is_published: isPublished,
      status,
      published_at: publishedAt,
      seo_title: payload.seoTitle || payload.title,
      seo_description: payload.seoDescription || payload.excerpt,
      seo_keywords: payload.seoKeywords || '',
      canonical_url: payload.canonicalUrl || '',
      og_image: payload.ogImage || payload.featuredImage,
      schema_type: payload.schemaType || 'EducationalArticle',
      meta_robots: payload.metaRobots || 'index, follow',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await adminSupabase
      .from('blogs')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('[serverBlogService.createPost]', error);
      throw new Error(error.message);
    }

    return mapDbRowToBlogPost(data);
  },

  /**
   * Admin: Update an existing blog post
   */
  async updatePost(id: string, payload: Partial<BlogPostPayload>): Promise<BlogPost> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.slug !== undefined) updateData.slug = payload.slug.trim() || generateSlug(payload.title || '');
    if (payload.excerpt !== undefined) updateData.excerpt = payload.excerpt;
    if (payload.content !== undefined) {
      updateData.content = payload.content;
      if (!payload.readTime) {
        updateData.read_time = calculateReadTime(payload.content);
      }
    }
    if (payload.author !== undefined) updateData.author = payload.author;
    if (payload.authorTitle !== undefined) updateData.author_title = payload.authorTitle;
    if (payload.authorAvatar !== undefined) updateData.author_avatar = payload.authorAvatar;
    if (payload.authorBio !== undefined) updateData.author_bio = payload.authorBio;
    if (payload.authorTwitter !== undefined) updateData.author_twitter = payload.authorTwitter;
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.featuredImage !== undefined) updateData.featured_image = payload.featuredImage;
    if (payload.readTime !== undefined) updateData.read_time = payload.readTime;
    if (payload.tags !== undefined) updateData.tags = payload.tags;

    if (payload.isPublished !== undefined || payload.status !== undefined) {
      const isPub = payload.isPublished ?? (payload.status === 'published');
      updateData.is_published = isPub;
      updateData.status = isPub ? 'published' : 'draft';
      if (isPub && !payload.slug) {
        updateData.published_at = new Date().toISOString();
      }
    }

    if (payload.seoTitle !== undefined) updateData.seo_title = payload.seoTitle;
    if (payload.seoDescription !== undefined) updateData.seo_description = payload.seoDescription;
    if (payload.seoKeywords !== undefined) updateData.seo_keywords = payload.seoKeywords;
    if (payload.canonicalUrl !== undefined) updateData.canonical_url = payload.canonicalUrl;
    if (payload.ogImage !== undefined) updateData.og_image = payload.ogImage;
    if (payload.schemaType !== undefined) updateData.schema_type = payload.schemaType;
    if (payload.metaRobots !== undefined) updateData.meta_robots = payload.metaRobots;

    const { data, error } = await adminSupabase
      .from('blogs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[serverBlogService.updatePost]', error);
      throw new Error(error.message);
    }

    return mapDbRowToBlogPost(data);
  },

  /**
   * Admin: Delete a blog post
   */
  async deletePost(id: string): Promise<boolean> {
    const { error } = await adminSupabase.from('blogs').delete().eq('id', id);
    if (error) {
      console.error('[serverBlogService.deletePost]', error);
      throw new Error(error.message);
    }
    return true;
  },
};
