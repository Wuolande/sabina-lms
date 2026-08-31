/**
 * Blog Domain Types
 * -----------------------------------------------------------------------
 * Comprehensive typed representations for articles, categories,
 * SEO metadata, Schema.org types, and media assets.
 * -----------------------------------------------------------------------
 */

export type BlogSchemaType =
  | 'Article'
  | 'BlogPosting'
  | 'EducationalArticle'
  | 'TechArticle'
  | 'NewsArticle';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorTitle?: string;
  authorAvatar?: string;
  authorBio?: string;
  authorTwitter?: string;
  category: string;
  featuredImage: string;
  readTime: string;
  tags: string[];
  isPublished: boolean;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  
  // SEO & Social Graph Metadata
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  schemaType?: BlogSchemaType;
  metaRobots?: string;
  
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
  authorBio?: string;
  authorTwitter?: string;
  category: string;
  featuredImage: string;
  readTime?: string;
  tags?: string[];
  isPublished?: boolean;
  status?: 'draft' | 'published' | 'archived';
  
  // SEO & Social Graph Metadata
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  schemaType?: BlogSchemaType;
  metaRobots?: string;
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

export const SCHEMA_TYPES: { id: BlogSchemaType; label: string; description: string }[] = [
  { id: 'Article', label: 'Standard Article', description: 'General educational or long-form publication' },
  { id: 'BlogPosting', label: 'Blog Post', description: 'Standard editorial blog post for search indexes' },
  { id: 'EducationalArticle', label: 'Educational Article', description: 'Structured learning guide or lesson plan' },
  { id: 'TechArticle', label: 'Technical Article', description: 'Coding, mathematical, or engineering tutorial' },
  { id: 'NewsArticle', label: 'News / Announcement', description: 'Platform news or milestone release' },
];
