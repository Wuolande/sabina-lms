"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Mail,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BlogCard } from "@/components/blog/BlogCard";
import { FeaturedBlogCard } from "@/components/blog/FeaturedBlogCard";
import { BlogPost, BLOG_CATEGORIES } from "@/src/modules/blog/types/blogTypes";
import { blogClientService } from "@/services/blogClientService";

export default function BlogListingPage() {
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalPosts, setTotalPosts] = React.useState(0);
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = React.useState(false);

  const fetchBlogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogClientService.getPosts({
        category: selectedCategory === "All" ? undefined : selectedCategory,
        search: searchQuery.trim() || undefined,
        page,
        pageSize: 9,
      });

      if (res && res.posts) {
        setPosts(res.posts);
        setTotalPages(res.totalPages || 1);
        setTotalPosts(res.total || 0);
      }
    } catch (err) {
      console.error("[BlogListingPage.fetchBlogs]", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, page]);

  React.useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs();
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) return;
    setNewsletterSubscribed(true);
  };

  const featuredPost = page === 1 && !searchQuery.trim() && selectedCategory === "All" && posts.length > 0 ? posts[0] : null;
  const standardPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ─── Hero Header & Search ─── */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-[#14209C] text-xs font-bold shadow-2xs">
            <BookOpen className="h-4 w-4 text-[#14209C]" />
            <span>SABINA LEARNING HUB & EDITORIAL</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-heading leading-tight">
            Knowledge, Strategies & <span className="text-[#14209C]">Learning Insights</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Expert articles on language acquisition, test preparation, STEM mastery, and personalized tutoring methodologies.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 max-w-lg mx-auto">
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title, topic, or author..."
                leftIcon={<Search className="h-4 w-4" />}
                className="pr-24 bg-white shadow-xs rounded-2xl h-12"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#14209C] hover:bg-[#0e176b] text-white font-bold rounded-xl text-xs px-4"
              >
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* ─── Category Filter Pills ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 justify-start sm:justify-center no-scrollbar">
          {BLOG_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#14209C] text-white shadow-md shadow-indigo-900/10 scale-105"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ─── Articles Content Area ─── */}
        {loading ? (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 animate-pulse h-96" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
                  <div className="aspect-16/10 bg-slate-200 rounded-2xl w-full" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 rounded w-4/5" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : posts.length === 0 ? (
          /* Empty Search State */
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-[#14209C] flex items-center justify-center mx-auto">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No articles found</h3>
            <p className="text-xs text-slate-500">
              We couldn&apos;t find any articles matching &quot;{searchQuery || selectedCategory}&quot;. Try exploring other categories.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="rounded-xl font-bold text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Post Hero */}
            {featuredPost && <FeaturedBlogCard post={featuredPost} />}

            {/* Main Articles Grid */}
            {standardPosts.length > 0 && (
              <div className="space-y-6">
                {featuredPost && (
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900 font-heading">
                      Latest Educational Articles
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      Showing {totalPosts} {totalPosts === 1 ? "article" : "articles"}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {standardPosts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl border-slate-200 gap-1 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <span className="text-xs font-bold text-slate-600 px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-xl border-slate-200 gap-1 text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── Newsletter Lead Magnet Banner ─── */}
        <div className="bg-slate-900 rounded-3xl sm:rounded-[36px] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-bold">
              <Mail className="h-3.5 w-3.5" />
              <span>WEEKLY STUDY DIGEST</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight leading-tight">
              Get the latest learning strategies delivered to your inbox
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Join 15,000+ students and educators receiving our weekly breakdown of language tips, study habits, and tutor spotlights.
            </p>

            {newsletterSubscribed ? (
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>You&apos;re on the list! Watch your inbox for our next issue.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 pt-2">
                <Input
                  type="email"
                  required
                  placeholder="Enter your work or school email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-2xl h-12 flex-1"
                />
                <Button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl h-12 px-6 shrink-0 shadow-lg shadow-emerald-500/20"
                >
                  Subscribe Free
                </Button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
