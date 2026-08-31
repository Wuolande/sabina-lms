/**
 * Blog Domain Types
 * -----------------------------------------------------------------------
 * Typed representations for articles, categories, metadata, and filters.
 * -----------------------------------------------------------------------
 */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorTitle?: string;
  authorAvatar?: string;
  category: string;
  featuredImage: string;
  readTime: string;
  tags: string[];
  isPublished: boolean;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostPayload {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  author: string;
  authorTitle?: string;
  authorAvatar?: string;
  category: string;
  featuredImage: string;
  readTime?: string;
  tags?: string[];
  isPublished?: boolean;
  status?: 'draft' | 'published' | 'archived';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface BlogFilterOptions {
  search?: string;
  category?: string;
  tag?: string;
  status?: 'all' | 'published' | 'draft';
  page?: number;
  pageSize?: number;
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categories: { name: string; count: number }[];
}

export const BLOG_CATEGORIES = [
  'All',
  'Languages',
  'STEM & Math',
  'Coding & Tech',
  'Exam Prep',
  'Learning Science',
  'Career & Growth',
  'Tutor Spotlights',
] as const;
